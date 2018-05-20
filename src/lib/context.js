import * as PHPType from "./php-type"
import {Identifier, Class, ConstRef} from "./shadowtree"
import * as PHPError from "./php-error"
import * as ClassContext from "./class-context"
import {FileContext} from "./file-context"
import {GlobalContext} from "./global-context"
import {Assertion} from "./boolean-state"

const fs = require("fs")
const path = require("path")
const zlib = require("zlib")

/**
 * Reads JSON from a compressed PHP info data file
 *
 * @param {string} filename
 * @returns {*}
 */
function readPHPInfo(filename) {
    let compressed = fs.readFileSync(
        __dirname + "/../../data/" + filename
    )
    return JSON.parse(zlib.gunzipSync(compressed).toString("utf8"))
}

/** @type {boolean} If true, this will dump out type info */
const DEBUG_TYPES = false

/** @type {boolean} If true, invalid parent:: references will be ignored */
const IgnoreInvalidParent = true

/**
 * @type {string[]} From ./php-bin/php-constants | gzip > data/php-constants.json.gz
 */
const PHPConstants = readPHPInfo("php-constants.json.gz")

/**
 * @type {{[x: string]: {pbr: boolean[]}}}
 *
 * From: ./php-bin/php-functions | gzip > data/php-functions.json.gz
 */
const PHPFunctions = readPHPInfo("php-functions.json.gz")

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
    array_filter: new PHPType.IndexedArray(new PHPType.Mixed(null, "array_filter").union).union,
    array_key_exists: PHPType.Core.types.bool,
    array_keys: new PHPType.IndexedArray(PHPType.Core.types.string).union,
    array_map: new PHPType.IndexedArray(new PHPType.Mixed(null, "array_map").union).union,
    array_values: new PHPType.IndexedArray(new PHPType.Mixed(null, "array_values").union).union,
    ceil: PHPType.Core.types.float,
    count: PHPType.Core.types.int,
    floor: PHPType.Core.types.float,
    openssl_decrypt: PHPType.Core.types.string.addTypesFrom(PHPType.Core.types.bool.withValue(false)),
    openssl_encrypt: PHPType.Core.types.string.addTypesFrom(PHPType.Core.types.bool.withValue(false)),
    preg_replace: PHPType.Core.types.string,
    strcmp: PHPType.Core.types.int,
    stripos: PHPType.Core.types.int.addTypesFrom(PHPType.Core.types.bool.withValue(false)),
    strrpos: PHPType.Core.types.int.addTypesFrom(PHPType.Core.types.bool.withValue(false)),
    strtolower: PHPType.Core.types.string,
    strtoupper: PHPType.Core.types.string,
    substr: PHPType.Core.types.string,
    time: PHPType.Core.types.int,
}

/**
 * @param {PHPType.Union} union
 * @returns {PHPType.Union}
 */
function arrayMemberType(union) {
    let mt = PHPType.Union.empty
    union.types.forEach(t => {
        if(t instanceof PHPType.AssociativeArray) {
            mt = mt.addTypesFrom(t.memberType)
        } else if(t instanceof PHPType.IndexedArray) {
            mt = mt.addTypesFrom(t.memberType)
        } else if(t instanceof PHPType.Mixed) {
            mt = mt.addType(t)
        } else {
            mt = mt.addType(new PHPType.Mixed(null, null, "array extract"))
        }
    })
    return mt
}

/**
 * @type {{[x: string]: function(PHPType.Union[], PHPType.Function): PHPType.Union}}
 */
const PHPFunctionReturnTypeCallback = {
    array_combine: function(args, ftype) {
        return new PHPType.AssociativeArray(arrayMemberType(args[1])).union
    },
    array_filter: function(args, ftype) {
        return new PHPType.AssociativeArray(arrayMemberType(args[0])).union
    },
    array_map: function(args, ftype) {
        let t = PHPType.Union.empty
        args[0].types.forEach(
            ft => {
                if(ft instanceof PHPType.Function) {
                    t = t.addTypesFrom(
                        ft.returnTypeGiven([
                            arrayMemberType(args[1])
                        ])
                    )
                } else {
                    t = t.addType(new PHPType.Mixed(null, null, "array map"))
                }
            }
        )
        if(args[1].types.some(t => !(t instanceof PHPType.IndexedArray))) {
            return new PHPType.AssociativeArray(t).union
        } else {
            return new PHPType.IndexedArray(t).union
        }
    },
    array_pop: function(args, ftype) {
        return arrayMemberType(args[0]).addTypesFrom(PHPType.Core.types.null)
    },
    array_shift: function(args, ftype) {
        return arrayMemberType(args[0]).addTypesFrom(PHPType.Core.types.null)
    },
    array_values: function(args, ftype) {
        return new PHPType.IndexedArray(arrayMemberType(args[0])).union
    },
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
                    PHPFunctions[name].pbr.map(arg => new PHPType.Mixed(null, name).union),
                    PHPFunctionReturnType[name] || new PHPType.Mixed(null, name).union,
                    PHPFunctions[name].pbr,
                    [],
                    PHPFunctionReturnTypeCallback[name]
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
     * @param {GlobalContext} global_context
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
        /** @type {?ClassContext.Class} The class, if any */
        this.classContext = class_context
        this.depth = depth
        this.globalContext = global_context
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
     * Returns the set of types that the given name complies with (aside from itself)
     *
     * @param {string} name
     * @returns {string[]}
     */
    compliantNames(name) {
        if(PHPType.Core.types[name]) {
            return []
        } else {
            let c = this.findClass(name)
            if(c) {
                /** @type {string[]} */
                let types = []
                types = types.concat(c.interfaceNames)
                while(c.superclass) {
                    c = c.superclass
                    types.push(c.name)
                    types = types.concat(c.interfaceNames)
                }
                return types
            } else {
                return []
            }
        }
    }

    /**
     * Finds the class context with the given name
     *
     * @param {string} name Fully qualified only
     * @param {boolean} [expecting_miss] True if you're expecting not to find it
     * @returns {?ClassContext.Class}
     */
    findClass(name, expecting_miss = false) {
        if(name == "self") {
            return this.classContext
        } else if(
            name != "mixed" &&
            name != "object" &&
            PHPType.Core.types[name]
        ) {
            throw new PHPError.NotClass(`Attempt to access core type ${name} as class`)
        } else {
            return this.globalContext.findClass(name, this.fileContext, this.depth, expecting_miss)
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
     * Chainable way of setting the class context
     *
     * @param {ClassContext.Class} class_context
     * @returns {this}
     */
    forClass(class_context) {
        this.classContext = class_context
        return this
    }

    /**
     *
     * @param {Assertion[]} assertions
     */
    importAssertions(assertions) {
        assertions.forEach(
            a => {
                if(this.ns[a.symbol]) {
                    if(a.not) {
                        this.ns[a.symbol] = this.ns[a.symbol].difference(a.type)
                    } else {
                        this.ns[a.symbol] = this.ns[a.symbol].intersection(a.type)
                    }
                }
            }
        )
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