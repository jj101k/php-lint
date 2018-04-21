import * as PHPType from "./php-type"
import {Identifier, Class, ConstRef} from "./shadowtree"
import * as PHPError from "./php-error"
import * as ClassContext from "./class-context"
import {FileContext} from "./file-context"
import {GlobalContext} from "./global-context"

const fs = require("fs")
const path = require("path")

/** @type {boolean} If true, this will dump out type info */
const DEBUG_TYPES = false

/** @type {boolean} If true, invalid parent:: references will be ignored */
const IgnoreInvalidParent = true

/**
 * @type {string[]} From ./php-bin/php-constants > data/php-constants.json
 */
const PHPConstants = JSON.parse(fs.readFileSync(
    __dirname + "/../../data/php-constants.json",
    "utf8"
))

/**
 * @type {{[x: string]: {pbr: boolean[]}}}
 *
 * From: ./php-bin/php-functions > data/php-functions.json
 */
const PHPFunctions = JSON.parse(fs.readFileSync(
    __dirname + "/../../data/php-functions.json",
    "utf8"
))

/**
 * @type {{[x: string]: string}} From `print json_encode(array_map("gettype",
 * get_defined_vars()), JSON_PRETTY_PRINT);`
 */
const PHPSuperglobals = {
    "_ENV": "array",
    "_GET": "array",
    "_POST": "array",
    "_COOKIE": "array",
    "_FILES": "array",
    "argv": "array",
    "argc": "int",
    "_SERVER": "array",
    "_SESSION": "array",
    "GLOBALS": "array",
}

const PHPFunctionReturnType = {
    array_filter: PHPType.Core.types.array,
    array_key_exists: PHPType.Core.types.bool,
    array_keys: new PHPType.IndexedArray(PHPType.Core.types.string).union,
    array_map: PHPType.Core.types.array,
    array_values: new PHPType.IndexedArray(PHPType.Core.types.mixed).union,
    ceil: PHPType.Core.types.float,
    count: PHPType.Core.types.int,
    floor: PHPType.Core.types.float,
    openssl_decrypt: PHPType.Core.types.string.addTypesFrom(PHPType.Core.types.bool),
    openssl_encrypt: PHPType.Core.types.string.addTypesFrom(PHPType.Core.types.bool),
    preg_replace: PHPType.Core.types.string,
    strcmp: PHPType.Core.types.int,
    stripos: PHPType.Core.types.int.addTypesFrom(PHPType.Core.types.bool),
    strrpos: PHPType.Core.types.int.addTypesFrom(PHPType.Core.types.bool),
    time: PHPType.Core.types.int,
}

/**
 * This defines the entire context applying to the current node.
 */
export default class Context {
    /**
     * @type {{[x: string]: PHPType.Union}} A map of names to types for the
     * "always global" core PHP variables and functions.
     */
    static get superGlobals() {
        if(!this._superGlobals) {
            this._superGlobals = {}
            Object.keys(PHPSuperglobals).forEach(
                name => this._superGlobals["$" + name] =
                    PHPType.Core.named(PHPSuperglobals[name])
            )
            Object.keys(PHPFunctions).forEach(
                name => this._superGlobals[name] = new PHPType.Function(
                    PHPFunctions[name].pbr.map(arg => PHPType.Core.types.mixed),
                    PHPFunctionReturnType[name] || new PHPType.Mixed(null, name).union,
                    PHPFunctions[name].pbr
                ).union
            )
            PHPConstants.forEach(
                name => this._superGlobals[name] = new PHPType.Mixed(null, name).union
            )
            Object.freeze(this._superGlobals)
        }
        return this._superGlobals
    }

    /**
     * Builds the object
     * @param {FileContext} file_context
     * @param {?GlobalContext} global_context
     * @param {?ClassContext.Class} [class_context]
     * @param {?{[x: string]: PHPType.Union}} [ns]
     * @param {number} [depth]
     */
    constructor(
        file_context,
        global_context,
        class_context = null,
        ns = null,
        depth = 0
    ) {
        this.classContext = class_context
        this.depth = depth
        this.globalContext = global_context || new GlobalContext()
        this.fileContext = file_context
        /** @type {?PHPType.Union} */
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
            let composer_path =
                this.globalContext.findComposerConfig(file_directory)
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
     * @param {PHPType.Union} types
     * @returns {PHPType.Union} The original types
     */
    addName(name, types) {
        if(!this.ns[name]) {
            this.ns[name] = Context.superGlobals[name] || PHPType.Union.empty
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
     *
     * @param {boolean} keep_ns If this is true, the same namespace will be
     * linked. Otherwise it will copy non-variables into the new namespace.
     * @returns {Context}
     */
    childContext(keep_ns = false) {
        let ns
        if(keep_ns) {
            ns = this.ns
        } else {
            ns = {}
            Object.keys(this.ns).filter(
                name => name.match(/^\w/)
            ).forEach(name => {
                ns[name] = this.ns[name]
            })
        }
        return new Context(
            this.fileContext,
            this.globalContext,
            this.classContext,
            ns,
            this.depth
        )
    }

    /**
     * Returns the set of types that the given name complies with.
     *
     * @param {string} name
     * @returns {string[]}
     */
    compliantNames(name) {
        let c = this.findClass(name)
        if(c) {
            /** @type {string[]} */
            let types = []
            while(c.superclass) {
                c = c.superclass
                types.push(c.name)
            }
            return types
        } else {
            return []
        }
    }

    /**
     * Finds the class context with the given name
     * @param {string} name Fully qualified only
     * @returns {?ClassContext.Class}
     */
    findClass(name) {
        if(name == "self") {
            return this.classContext
        } else if(
            name != "mixed" &&
            name != "object" &&
            PHPType.Core.types[name]
        ) {
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
     * @returns {PHPType.Union}
     */
    findName(name) {
        var types = this.ns[name] || Context.superGlobals[name]
        return types
    }

    /**
     * Finds the trait context with the given name
     *
     * @param {string} name Fully qualified only
     * @returns {?ClassContext.Trait}
     */
    findTrait(name) {
        return this.globalContext.findTrait(name, this.fileContext, this.depth)
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
            if(PHPType.Core.types[md[2]]) {
                return md[1]
            } else {
                return name
            }
        }
        switch(resolution) {
            case "fqn":
                return name
            case "uqn":
                if(
                    name == "self" &&
                    this.classContext &&
                    !(this.classContext instanceof ClassContext.Trait)
                ) {
                    return this.classContext.name
                } else if(PHPType.Core.types[name.replace(/\W.*$/, "")]) {
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
            throw new Error(
                `Unable to resolve node name for node ${JSON.stringify(node)}`
            )
        }
    }

    /**
     * Sets the type(s) for a name. This overwrites any types already assigned
     * to the name.
     * @param {string} name
     * @param {PHPType.Union} types
     * @returns {PHPType.Union}
     */
    setName(name, types) {
        this.ns[name] = types
        return types
    }

    /**
     * Sets $this in the scope.
     *
     * @param {?PHPType.Union} [type]
     * @returns {PHPType.Union}
     */
    setThis(type = null) {
        if(this.classContext && !(this.classContext instanceof ClassContext.Trait)) {
            this.ns["$this"] = type || PHPType.Core.named(this.classContext.name)
        } else {
            this.ns["$this"] = type || PHPType.Core.types.self
        }
        return this.ns["$this"]
    }
}