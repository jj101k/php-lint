import {PHPFunctionType, PHPSimpleType, PHPTypeUnion} from "./phptype"
import {Identifier, Class, ConstRef} from "./shadowtree"
import * as PHPError from "./php-error"
import {ClassContext, TraitContext} from "./class-context"
import {FileContext} from "./file-context"
import {GlobalContext} from "./global-context"

const fs = require("fs")
const path = require("path")

/** @type {boolean} If true, this will dump out type info */
const DEBUG_TYPES = false

/** @type {boolean} If true, invalid parent:: references will be ignored */
const IgnoreInvalidParent = true

/**
 * @type {string[]} From `print json_encode(array_keys(get_defined_constants()), JSON_PRETTY_PRINT);`
 */
const PHPConstants = JSON.parse(fs.readFileSync(__dirname + "/../../data/php-constants.json", "utf8"))

/**
 * @type {{[x: string]: boolean[]}}
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

/** @type {{[x: string]: string}} From `print json_encode(array_map("gettype", get_defined_vars()), JSON_PRETTY_PRINT);` */
const PHPSuperglobals = {
    "_ENV": "array",
    "_GET": "array",
    "_POST": "array",
    "_COOKIE": "array",
    "_FILES": "array",
    "argv": "array",
    "argc": "integer",
    "_SERVER": "array",
    "_SESSION": "array",
    "GLOBALS": "array",
}

/**
 * This defines the entire context applying to the current node.
 */
export default class Context {
    /**
     * @type {{[x: string]: PHPTypeUnion}} A map of names to types for the
     * "always global" core PHP variables and functions.
     */
    static get superGlobals() {
        if(!this._superGlobals) {
            this._superGlobals = {}
            Object.keys(PHPSuperglobals).forEach(
                name => this._superGlobals["$" + name] = PHPSimpleType.named(PHPSuperglobals[name])
            )
            Object.keys(PHPFunctions).forEach(
                name => this._superGlobals[name] = new PHPTypeUnion(new PHPFunctionType(
                    PHPFunctions[name].map(arg => PHPSimpleType.coreTypes.mixed),
                    name == "array_keys" ? PHPSimpleType.named("string[]") : PHPSimpleType.coreTypes.mixed,
                    PHPFunctions[name]
                ))
            )
            PHPConstants.forEach(
                name => this._superGlobals[name] = PHPSimpleType.coreTypes.mixed
            )
            Object.freeze(this._superGlobals)
        }
        return this._superGlobals
    }

    /**
     * Builds the object
     * @param {FileContext} file_context
     * @param {?GlobalContext} global_context
     * @param {?ClassContext} [class_context]
     * @param {?{[x: string]: PHPTypeUnion}} [ns]
     * @param {number} [depth]
     */
    constructor(file_context, global_context, class_context = null, ns = null, depth = 0) {
        this.classContext = class_context
        this.depth = depth
        this.globalContext = global_context || new GlobalContext()
        this.fileContext = file_context
        /** @type {?PHPTypeUnion} */
        this.assigningType = null
        this.ns = ns || {}
    }

    /**
     * @type {string[]} All the variable names in the namespace
     */
    get definedVariables() {
        return Object.keys(this.ns).filter(
            name => name.match(/^[$]/)
        ).concat(
            Object.keys(Context.superGlobals).filter(
                name => name.match(/^[$]/)
            )
        )
    }

    /**
     * @type {string}
     */
    get directory() {
        return this.globalContext.workingDirectory
    }

    set directory(v) {
        this.globalContext.workingDirectory = v
    }

    /**
     * @type {?FileContext}
     */
    get fileContext() {
        return this._fileContext
    }

    set fileContext(v) {
        this._fileContext = v
        if(v && !this.directory) {
            let file_directory = v.directory
            let composer_path = this.globalContext.findComposerConfig(file_directory)
            if(composer_path) {
                this.directory = path.dirname(composer_path)
            } else {
                this.directory = file_directory
            }
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
            this.ns[name] = Context.superGlobals[name] || PHPTypeUnion.empty
        }
        this.ns[name] = this.ns[name].addTypesFrom(types)
        if(DEBUG_TYPES) {
            console.log(`Types for ${name} are: ${this.ns[name]}`)
        }
        return types
    }

    /**
     * Updates which directory the context will work from. Generally only makes
     * sense at the very start of a file.
     *
     * @param {string} directory
     */
    chdir(directory) {
        this.directory = path.resolve(this.directory, directory)
    }

    /**
     * Checks a PHP script
     * @param {string} filename
     * @param {boolean} [with_warnings]
     */
    checkFile(filename, with_warnings = true) {
        let full_filename = path.resolve(this.directory, filename)
        try {
            this.globalContext.checkFile(full_filename, this.depth + 1)
        } catch(e) {
            if(e.errno == -2) {
                if(with_warnings) {
                    console.log(`${full_filename} missing, not installed?`)
                }
            } else {
                throw e
            }
        }
    }

    /**
     * Returns a new context which inherits from this one.
     * @param {boolean} keep_ns If this is true, the same namespace will be linked.
     * @returns {Context}
     */
    childContext(keep_ns = false) {
        return new Context(
            this.fileContext,
            this.globalContext,
            this.classContext,
            keep_ns ? this.ns : null,
            this.depth
        )
    }

    /**
     * Finds the class context with the given name
     * @param {string} name Fully qualified only
     * @returns {?ClassContext}
     */
    findClass(name) {
        if(name == "self") {
            return this.classContext
        } else if(name != "mixed" && name != "object" && PHPSimpleType.coreTypes[name]) {
            console.log(`Attempt to access core type ${name} as class`)
            return null
        } else {
            return this.globalContext.findClass(name, this.fileContext, this.depth)
        }
    }

    /**
     * If the name is in the namespace, returns its possible types. This only
     * finds variables and functions.
     *
     * @param {string} name eg "$bar"
     * @returns {PHPTypeUnion}
     */
    findName(name) {
        var types = this.ns[name] || Context.superGlobals[name]
        return types
    }

    /**
     * Copies the namespace from one context to another. The existing namespace
     * will still be retained.
     * @param {Context} context
     */
    importNamespaceFrom(context) {
        Object.keys(context.ns).forEach(
            name => {
                if(this.ns[name]) {
                    this.ns[name] = this.ns[name].addTypesFrom(context.ns[name])
                } else {
                    this.ns[name] = context.ns[name]
                }
            }
        )
    }

    /**
     * Resolves a given name, eg, for "Foo::$bar" this would resolve "Foo". This
     * does not handle multi-node lookups.
     *
     * Variable names are not handled here as they do not require resolution.
     *
     * @param {string} name
     * @param {string} [resolution] eg. "uqn"
     * @returns {string}
     */
    resolveName(name, resolution = "uqn") {
        let md
        if(md = name.match(/^\u005c((\w+)(?:\W.*)?)/)) {
            if(PHPSimpleType.coreTypes[md[2]]) {
                return md[1]
            } else {
                return name
            }
        }
        switch(resolution) {
            case "fqn":
                return name
            case "uqn":
                if(name == "self" && this.classContext && !(this.classContext instanceof TraitContext)) {
                    return this.classContext.name
                } else if(PHPSimpleType.coreTypes[name.replace(/\W.*$/, "")]) {
                    return name
                } else if(this.classContext) {
                    let class_name
                    try {
                        class_name = this.classContext.resolveName(name)
                    } catch(e) {
                        if(e instanceof PHPError.Error && IgnoreInvalidParent) {
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
            case "qn":
                md = name.match(/^(.*)\\(.*)/)
                return `${this.resolveName(md[1])}\\${md[2]}`
            default:
                console.log(name)
                throw new Error(`TODO don't know how to resolve ${resolution}`)
        }
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
            return this.resolveName(node.name, node.resolution)
        } else if(typeof node.name == "string") {
            return this.resolveName(node.name)
        } else {
            throw new Error(`Unable to resolve node name for ${node}`)
        }
    }

    /**
     * Sets the type(s) for a name. This overwrites any types already assigned
     * to the name.
     * @param {string} name
     * @param {PHPTypeUnion} types
     * @returns {PHPTypeUnion}
     */
    setName(name, types) {
        this.ns[name] = types
        return types
    }

    /**
     * Sets $this in the scope.
     * @returns {PHPTypeUnion}
     */
    setThis() {
        if(this.classContext && !(this.classContext instanceof TraitContext)) {
            this.ns["$this"] = PHPSimpleType.named(this.classContext.name)
        } else {
            this.ns["$this"] = PHPSimpleType.coreTypes.self
        }
        return this.ns["$this"]
    }
}