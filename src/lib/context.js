import {PHPFunctionType, PHPSimpleType, PHPTypeUnion} from "./phptype"
import {Identifier} from "./shadowtree"

const fs = require("fs")
const path = require("path")
const phpLint = require("../index") // TODO improve

export class FileContext {
    /**
     *
     * @param {string} filename
     */
    constructor(filename) {
        this.filename = filename
        this._namespace = null
    }

    /** @type {?string} eg "\\Foo" for the class \Foo\Bar */
    get namespace() {
        return this._namespace
    }
    set namespace(v) {
        this._namespace = v
    }

    /**
     * The fully resolved name
     * @param {string} name
     * @returns {string}
     */
    resolveName(name) {
        if(this.namespace) {
            return `\\${this.namespace}\\${name}`
        } else {
            return `\\${name}`
        }
    }
}

/**
 * Defines content in a specific class
 */
class ClassContext {
    /**
     * Builds the object
     * @param {string} name Fully qualified only
     */
    constructor(name) {
        this.name = name
        this.staticIdentifiers = {}
        this.instanceIdentifiers = {}
    }
    /**
     * Adds a known identifier
     * @param {string} name
     * @param {string} scope "public", "private" or "protected"
     * @param {PHPTypeUnion} types
     * @param {boolean} is_static
     */
    addIdentifier(name, scope, is_static, types) {
        if(is_static) {
            this.staticIdentifiers[name] = {
                scope: scope,
                types: types,
            }
        } else {
            this.instanceIdentifiers[name] = {
                scope: scope,
                types: types,
            }
        }
    }
    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPTypeUnion}
     */
    findInstanceIdentifier(name, from_class_context) {
        let m = this.instanceIdentifiers[name]
        if(m) {
            if(from_class_context === this || m.scope == "public") {
                return m.types
            }
            // TODO inheritance
        }
        return null
    }
    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPTypeUnion}
     */
    findStaticIdentifier(name, from_class_context) {
        let m = this.staticIdentifiers[name]
        if(m) {
            if(from_class_context === this || m.scope == "public") {
                return m.types
            }
            // TODO inheritance
        }
        return null
    }

    /**
     * The fully resolved name
     * @param {string} context
     * @returns {?string}
     */
    resolveName(name) {
        if(name == "parent") {
            return this.superclass.name
        } else if(name == "self") {
            return this.name
        } else if(name == "static") {
            return this.name
        } else {
            return null
        }
    }
}

/**
 * This defines content that's defined from the global scope, ie. everything
 * that is not anonymous.
 */
export class GlobalContext {
    /**
     * This returns autoload config from the given composer.json
     * @param {?string} filename eg. /foo/bar/composer.json
     * @param {?string} vendor_path If unset, this will be based on the filename
     * @returns {?Object.<string,string[]>} Class name prefixes mapped to arrays
     * of paths. Each path should end with a /, and most prefixes will also.
     */
    static autoloadFromComposer(filename, vendor_path = null) {
        if(!filename) return null
        /** @type {string} The current module (or whole project) root */
        let current_module_path = path.dirname(filename)
        let composer_config = JSON.parse(fs.readFileSync(filename, "utf8"))
        let autoload_paths = {}
        if(composer_config.autoload) {
            let psr0 = composer_config.autoload["psr-0"]
            if(psr0) {
                Object.keys(psr0).forEach(
                    prefix => {
                        autoload_paths[prefix] = [psr0[prefix]].map(
                            path => `${current_module_path}/${path}/${prefix.replace(/[_\\]/g, "")}/`
                        )
                    }
                )
            }
            let psr4 = composer_config.autoload["psr-4"]
            if(psr4) {
                Object.keys(psr4).forEach(
                    prefix => {
                        autoload_paths[prefix] = (psr4[prefix] instanceof Array ?
                            psr4[prefix] :
                            [psr4[prefix]]
                        ).map(
                            path => `${current_module_path}/${path}`
                        )
                    }
                )
            }
        }
        if(!vendor_path) {
            vendor_path = path.dirname(filename) + "/vendor"
        }
        if(composer_config.require) {
            Object.keys(composer_config.require).filter(
                uid => uid.match(/\//)
            ).forEach(
                uid => autoload_paths = Object.assign(
                    {},
                    this.autoloadFromComposer(
                        `${vendor_path}/${uid}/composer.json`,
                        vendor_path
                    ),
                    autoload_paths
                )
            )
        }
        return autoload_paths
    }

    /**
     * Builds the context
     */
    constructor() {
        this.classes = {}
    }

    /**
     * Adds a known class
     * @param {string} name Fully qualified only
     * @returns {ClassContext}
     */
    addClass(name) {
        return this.classes[name] = this.classes[name] || new ClassContext(name)
    }

    /**
     * Given a path for the current file, walks up the tree looking for composer.json.
     *
     * @param {string} actual_path eg. /foo/bar/lib/Baz/
     * @return {?string} eg. /foo/bar/composer.json
     */
    findComposerConfig(actual_path) {
        while(actual_path.match(/^\/+[^\/]/)) {
            if(fs.existsSync(`${actual_path}/composer.json`)) {
                return `${actual_path}/composer.json`
            }
            actual_path = path.dirname(actual_path)
        }
        return null
    }

    /**
     * Finds the class context with the given name
     * @param {string} name Fully qualified only
     * @param {FileContext} file_context
     * @returns {?ClassContext}
     */
    findClass(name, file_context) {
        if(name.match(/^\\\\/)) {
            throw new Error(`Invalid class name ${name}`)
        }
        let filename = file_context.filename
        if(this.classes.hasOwnProperty(name)) {
            return this.classes[name]
        } else {
            // Autoload go!
            if(!this.autoloadPaths) {
                let dir = path.dirname(path.resolve(filename))
                this.autoloadPaths = GlobalContext.autoloadFromComposer(
                    this.findComposerConfig(dir)
                )
            }
            let canonical_class_name = name.replace(/^\\+/, "").replace(/_/g, '\\')
            let paths = Object.keys(this.autoloadPaths)
            paths.sort((a, b) => b.length - a.length || a.localeCompare(b))
            for(let k of paths) {
                if(
                    k.length < canonical_class_name.length &&
                    k == canonical_class_name.substr(0, k.length)
                ) {
                    let path_tail = canonical_class_name.substr(k.length).replace(/\\/g, "/") + ".php"
                    let full_path = this.autoloadPaths[k].map(
                        path => path + path_tail
                    ).find(
                        path => fs.existsSync(path)
                    )
                    if(full_path) {
                        phpLint.checkFileSync(full_path)
                        if(!this.classes[name]) {
                            console.log(`Class ${name} not found at ${full_path}`)
                        }
                        return this.classes[name]
                    }

                }
            }
            console.log(`Could not load ${name}`)
            this.classes[name] = null
        }
        return this.classes[name]
    }
}

/**
 * This defines the entire context applying to the current node.
 */
export default class Context {
    /**
     * Builds the object
     * @param {?GlobalContext} global_context
     * @param {?ClassContext} class_context
     * @param {FileContext} file_context
     * @param {?Object.<string,PHPTypeUnion} ns
     */
    constructor(file_context, global_context, class_context, ns = null) {
        this.classContext = class_context
        this.globalContext = global_context || new GlobalContext()
        this.fileContext = file_context
        this.isAssigning = false
        this.ns = ns || {
            '$argv': new PHPTypeUnion(new PHPSimpleType("array")),
        }
    }
    /**
     * Adds a name to the namespace list.
     * @param {string} name eg. "$foo"
     * @param {PHPTypeUnion} types
     * @returns {PHPTypeUnion} The original types
     */
    addName(name, types) {
        if(!this.ns[name]) {
            this.ns[name] = new PHPTypeUnion()
        }
        this.ns[name].addTypesFrom(types)
        //console.log(`Types for ${name} are: ${this.ns[name]}`)
        return types
    }
    /**
     * Returns a new context which inherits from this one.
     * @param {boolean} keep_ns
     * @returns {Context}
     */
    childContext(keep_ns = false) {
        return new Context(
            this.fileContext,
            this.globalContext,
            this.classContext,
            keep_ns ? this.ns : null
        )
    }

    /**
     * Finds the class context with the given name
     * @param {string} name Fully qualified only
     * @returns {?ClassContext}
     */
    findClass(name) {
        return this.globalContext.findClass(name, this.fileContext)
    }

    /**
     * If the name is in the namespace, returns its possible types
     * @param {string} name eg "$bar"
     * @returns {PHPTypeUnion}
     */
    findName(name) {
        var types = this.ns[name]
        return types
    }

    /**
     * The fully resolved name
     * @param {string} name
     * @returns {string}
     */
    resolveName(name) {
        if(this.classContext) {
            let class_name = this.classContext.resolveName(name)
            if(class_name) {
                return class_name
            }
        }
        return this.fileContext.resolveName(name)
    }

    /**
     * Given that the node has a name, returns its fully resolved form.
     *
     * @param {Identifier|Node} node
     * @returns {string}
     */
    resolveNodeName(node) {
        if(node instanceof Identifier) {
            switch(node.resolution) {
                case "fqn":
                    return node.name
                case "uqn":
                    return this.resolveName(node.name)
                default:
                    console.log(node.node)
                    throw new Error(`TODO don't know how to resolve ${node.resolution}`)
            }
        } else {
            return this.resolveName(node.name)
        }
    }
}