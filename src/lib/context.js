import {PHPFunctionType, PHPSimpleType, PHPTypeUnion} from "./phptype"
import {Identifier, Class, ConstRef} from "./shadowtree"
import {PHPContextlessError} from "./phpstricterror"

const fs = require("fs")
const path = require("path")
const phpLint = require("../index") // TODO improve

/** @type {boolean} If true, autoload failure may throw. */
const DEBUG_AUTOLOAD = false

/** @type {boolean} If true, this will dump out type info */
const DEBUG_TYPES = false

/** @type {boolean} If true, invalid parent:: references will be ignored */
const IgnoreInvalidParent = true

/**
 * @type {string[]} From `print json_encode(get_declared_classes(), JSON_PRETTY_PRINT);`
 */
const PHPClasses = JSON.parse(fs.readFileSync(__dirname + "/../../data/php-classes.json", "utf8"))

/**
 * @type {Object.<string,boolean[]>}
 *
 * From:
 *
 * ```
 * print json_encode(array_combine(
 *     get_defined_functions()["internal"],
 *     array_map(function($n) {
 *         return array_map(
 *             function($p) {return $p->isPassedByReference();},
 *             (new ReflectionFunction($n))->getParameters()
 *         );
 *     }, get_defined_functions()["internal"])
 * ), JSON_PRETTY_PRINT);
 * ```
 */
const PHPFunctions = JSON.parse(fs.readFileSync(__dirname + "/../../data/php-functions.json", "utf8"))

/** @type {Object.<string,string>} From `print json_encode(array_map("gettype", get_defined_vars()), JSON_PRETTY_PRINT);` */
const PHPSuperglobals = {
    "_GET": "array",
    "_POST": "array",
    "_COOKIE": "array",
    "_FILES": "array",
    "argv": "array",
    "argc": "integer",
    "_SERVER": "array",
    "_SESSION": "array"
}

export class FileContext {
    /**
     *
     * @param {string} filename
     */
    constructor(filename) {
        this.filename = filename
        this._namespace = null
        this.aliases = {}
    }

    /** @type {?string} eg "\\Foo" for the class \Foo\Bar */
    get namespace() {
        return this._namespace
    }
    set namespace(v) {
        this._namespace = v
    }

    /**
     * Creates an alias, as from `use \Foo\Bar` or `use \Foo as Bar`
     *
     * @param {string} real_name eg "\\Foo\\Bar"
     * @param {string} alias eg. "Bar"
     */
    alias(real_name, alias) {
        this.aliases[alias] = real_name.replace(/^\\+/, "")
    }

    /**
     * The fully resolved name
     *
     * @param {string} name
     * @returns {string}
     */
    resolveName(name) {
        if(this.aliases[name]) {
            return "\\" + this.aliases[name]
        }
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
     * @param {?ClassContext} superclass
     */
    constructor(name, superclass = null) {
        this.name = name
        this.staticIdentifiers = {}
        this.instanceIdentifiers = {}
        this.superclass = superclass
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
            this.instanceIdentifiers[name.replace(/^[$]/, "")] = {
                scope: scope,
                types: types,
            }
        }
    }
    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @param {boolean} [in_call]
     * @returns {?PHPTypeUnion}
     */
    findInstanceIdentifier(name, from_class_context, in_call = false) {
        let m = this.instanceIdentifiers[name]
        let wrong_case
        if(m) {
            if(
                m.scope == "public" ||
                (
                    m.scope == "protected" &&
                    from_class_context.isSubclassOf(this)
                ) ||
                from_class_context === this
            ) {
                return m.types
            } else {
                throw new PHPContextlessError(
                    `Scope miss for name ${name} with scope ${m.scope}`
                )
            }
            // TODO inheritance
        } else if(wrong_case = Object.keys(this.instanceIdentifiers).find(n => n.toLowerCase() == name.toLowerCase())) {
            console.log(`Wrong case for identifier, ${name} != ${wrong_case}`)
            this.instanceIdentifiers[name] = this.instanceIdentifiers[wrong_case]
            return this.findInstanceIdentifier(wrong_case, from_class_context)
        } else if(this.superclass) {
            let superclass_types = this.superclass.findInstanceIdentifier(name, from_class_context)
            if(superclass_types) {
                return superclass_types
            }
        }
        if(in_call && name != "__call") {
            return this.findInstanceIdentifier("__call", from_class_context, true)
        } else if(!in_call && name != "__get") {
            if(this.findInstanceIdentifier("__get", from_class_context, true)) {
                return PHPTypeUnion.mixed
            }
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
        let wrong_case
        if(m) {
            if(from_class_context === this || m.scope == "public") {
                return m.types
            }
        } else if(wrong_case = Object.keys(this.staticIdentifiers).find(n => n.toLowerCase() == name.toLowerCase())) {
            console.log(`Wrong case for identifier, ${name} != ${wrong_case}`)
            this.staticIdentifiers[name] = this.staticIdentifiers[wrong_case]
            return this.findStaticIdentifier(wrong_case, from_class_context)
        } else if(this.superclass) {
            let superclass_types = this.superclass.findStaticIdentifier(name, from_class_context)
            if(superclass_types) {
                return superclass_types
            }
        }
        return null
    }

    /**
     * Returns true if this is a subclass of that class.
     * @param {ClassContext} other_class
     * @returns {boolean}
     */
    isSubclassOf(other_class) {
        if(this.superclass) {
            return(
                this.superclass === other_class ||
                this.superclass.isSubclassOf(other_class)
            )
        } else {
            return false
        }
    }

    /**
     * The fully resolved name
     * @param {string} context
     * @returns {?string}
     */
    resolveName(name) {
        if(name == "parent") {
            if(this.superclass) {
                return this.superclass.name
            } else {
                throw new PHPContextlessError(`Attempt to use parent:: with no superclass`)
            }
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
 * This handles traits
 */
class TraitContext extends ClassContext {
    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPTypeUnion}
     */
    findInstanceIdentifier(name, from_class_context) {
        return super.findInstanceIdentifier(name, from_class_context) || PHPTypeUnion.mixed
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPTypeUnion}
     */
    findStaticIdentifier(name, from_class_context) {
        return super.findStaticIdentifier(name, from_class_context) || PHPTypeUnion.mixed
    }
}

/**
 * This handles unknown classes
 */
class UnknownClassContext extends ClassContext {
    /**
     * Builds the object
     * @param {string} name Fully qualified only
     */
    constructor(name, superclass = null) {
        super(name)
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPTypeUnion}
     */
    findInstanceIdentifier(name, from_class_context) {
        return PHPTypeUnion.mixed
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPTypeUnion}
     */
    findStaticIdentifier(name, from_class_context) {
        return PHPTypeUnion.mixed
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
                            path => `${current_module_path}/${path}${prefix.replace(/[_\\]/g, "/")}/`
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
                            path => {
                                if(path.match(/\/$/) || path == "") {
                                    return `${current_module_path}/${path}`
                                } else {
                                    //console.log(`Path ${path} for ${prefix} is missing a trailing slash`)
                                    return `${current_module_path}/${path}/`
                                }
                            }
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
        PHPClasses.forEach(
            name => this.addUnknownClass("\\" + name)
        )
        this.addUnknownClass("mixed")
        this.addUnknownClass("object")
    }

    /**
     * Adds a known class
     * @param {string} name Fully qualified only
     * @param {?ClassContext} superclass
     * @returns {ClassContext}
     */
    addClass(name, superclass = null) {
        return this.classes[name] = this.classes[name] || new ClassContext(
            name,
            superclass
        )
    }

    /**
     * Adds an unknown class. For when the real name isn't known and you have to
     * use a placeholder. You can get the name from the return value.
     * @param {?string} [name]
     * @returns {UnknownClassContext}
     */
    addUnknownClass(name = null) {
        if(!name) {
            name = "Unknown" + Math.random()
        }
        return this.classes[name] = new UnknownClassContext(name)
    }

    /**
     * Adds a known trait
     * @param {string} name Fully qualified only
     * @param {?ClassContext} superclass
     * @returns {ClassContext}
     */
    addTrait(name, superclass = null) {
        return this.classes[name] = this.classes[name] || new TraitContext(
            name,
            superclass
        )
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
        let filename = file_context.filename
        if(this.classes.hasOwnProperty(name)) {
            return this.classes[name]
        } else {
            this.addUnknownClass(name)
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
                            console.log(
                                `Class ${name} not found at ${full_path}`
                            )
                            this.addUnknownClass(name)
                        }
                        return this.classes[name]
                    }

                }
            }
            if(DEBUG_AUTOLOAD) {
                console.log(this.autoloadPaths)
                throw new PHPContextlessError(`Could not load ${name}`)
            } else {
                console.log(`Could not load ${name}`)
                return this.classes[name]
            }
        }
    }

    /**
     * Returns an array of indications as to whether an argument is pass-by-reference.
     *
     * @param {string} name
     * @return {boolean[]}
     */
    passByReferencePositionsFor(name) {
        return PHPFunctions[name] || []
    }
}

/**
 * This defines the entire context applying to the current node.
 */
export default class Context {
    /**
     * @type {Object.<string,PHPTypeUnion>} A map of names to types for the
     * "always global" core PHP variables.
     */
    static get superGlobals() {
        var out = {}
        Object.keys(PHPSuperglobals).forEach(
            name => out["$" + name] = new PHPTypeUnion(new PHPSimpleType(PHPSuperglobals[name]))
        )
        return out
    }

    /**
     * Builds the object
     * @param {FileContext} file_context
     * @param {?GlobalContext} global_context
     * @param {?ClassContext} [class_context]
     * @param {?Object.<string,PHPTypeUnion>} [ns]
     */
    constructor(file_context, global_context, class_context = null, ns = null) {
        this.classContext = class_context
        this.globalContext = global_context || new GlobalContext()
        this.fileContext = file_context
        /** @type {?PHPTypeUnion} */
        this.isAssigning = null
        this.ns = ns || Context.superGlobals
    }
    /**
     * Adds a name to the namespace list.
     * @param {string} name eg. "$foo"
     * @param {PHPTypeUnion} types
     * @returns {PHPTypeUnion} The original types
     */
    addName(name, types) {
        if(!this.ns[name]) {
            this.ns[name] = PHPTypeUnion.empty
        }
        this.ns[name].addTypesFrom(types)
        if(DEBUG_TYPES) {
            console.log(`Types for ${name} are: ${this.ns[name]}`)
        }
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
            let class_name
            try {
                class_name = this.classContext.resolveName(name)
            } catch(e) {
                if(e instanceof PHPContextlessError && IgnoreInvalidParent) {
                    class_name = this.globalContext.addUnknownClass().name
                } else {
                    throw e
                }
            }
            if(class_name) {
                return class_name
            }
        }
        return this.fileContext.resolveName(name)
    }

    /**
     * Given that the node has a name, returns its fully resolved form.
     *
     * @param {Identifier|Class|ConstRef} node
     * @returns {string}
     */
    resolveNodeName(node) {
        if(node.name instanceof Identifier) {
            return this.resolveNodeName(node.name)
        } else if(node instanceof Identifier) {
            switch(node.resolution) {
                case "fqn":
                    return node.name
                case "uqn":
                    return this.resolveName(node.name)
                case "qn":
                    let [prefix, tail] = node.name.split(/\\/, 2)
                    return `${this.resolveName(prefix)}\\${tail}`
                default:
                    console.log(node.name)
                    throw new Error(`TODO don't know how to resolve ${node.resolution}`)
            }
        } else if(typeof node.name == "string") {
            return this.resolveName(node.name)
        }
    }
}