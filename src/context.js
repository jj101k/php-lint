import * as Type from "./type"
import { Function, Argument } from "./type/function";
import { Handlers } from "./content/considered/for-node";
import { LintError } from "./lint-error";

const debug = require("debug")("php-lint:context")

export class Context {
    /**
     * If you have a name which does not begin with a slash, it sticks a slash there.
     *
     * Used for contexts where you know the name is fully qualified but may not
     * begin with a "\\".
     *
     * @param name eg. "\\Foo" or "Foo"
     * @returns eg "\\Foo"
     */
    static pseudoQualify(name) {
        if(name[0] == "\\") {
            return name
        } else {
            return "\\" + name
        }
    }
    #aliases = new Map()
    /**
     * This is where functions go, as well as explicit constants. These get
     * inherited everywhere.
     */

    /**
     * Contains all constants, including null for any which failed autoload
     */
    #constantNamespace

    #globalNamespace
    /**
     * Stuff that has been defined here, ie variables
     */
    #localNamespace

    assigning = null
    /**
     * When true, the current action is an include which should be less strict
     * and is only required to detect all global/constant types
     */
    including = false
    namespacePrefix = null
    lint = null
    realReturnType = null
    returnType = null
    constructor(from_context = null) {
        this.#localNamespace = new Map()
        if(from_context) {
            this.#aliases = from_context.#aliases
            this.#constantNamespace = from_context.#constantNamespace
            this.#globalNamespace = from_context.#globalNamespace
            this.including = from_context.including
            this.lint = from_context.lint
        } else {
            this.#globalNamespace = new Map()
            this.#constantNamespace = new Map()
            this.buildGlobalSymbols()
        }
    }
    /**
     * Asserts that the test passed, or throws.
     *
     * @param node The current examining node
     * @param test A simple true/false value
     * @param message Optional message to describe what assertion failure means
     * @throws {Error} Invalid syntax
     */
    assert(
        node,
        test,
        message = "Invalid syntax",
    ) {
        if(!this.including && !test) {
            throw new LintError(message, node)
        }
    }

    /**
     * Checks a node, performing necessary state transitions
     *
     * @param type The type to assign
     * @param node The node defining the assign target
     */
    assign(type, node) {
        const was_assigning = this.assigning
        this.assigning = type
        const r = Handlers[node.kind](node, this)
        this.assigning = was_assigning
        return r
    }

    /**
     * Adds all known global symbols to the constant namespace
     */
    buildGlobalSymbols() {
        const fs = require("fs")
        const function_info = JSON.parse(
            fs.readFileSync(__dirname + "/../data/php-functions.json")
        )
        const class_info = JSON.parse(
            fs.readFileSync(__dirname + "/../data/php-classes.json")
        )
        const interface_info = JSON.parse(
            fs.readFileSync(__dirname + "/../data/php-interfaces.json")
        )
        const function_type_info = JSON.parse(
            fs.readFileSync(__dirname + "/../data/php-function-types.json")
        )
        for(const [name, info] of Object.entries(function_info)) {
            const documented_info = function_type_info[name]
            if(documented_info) {
                this.#constantNamespace.set(name, new Function(
                    documented_info.args.map(
                        a => new Argument(
                            this.documentedType(a.type, "qn"),
                            a.byReference,
                            !!a.optionalDepth
                        )
                    ),
                    documented_info.returnTypes.reduce(
                        (carry, item) => {
                            if(carry) {
                                return carry.combinedWith(
                                    this.documentedType(item, "qn")
                                )
                            } else {
                                return this.documentedType(item, "qn")
                            }
                        },
                        null
                    )
                ))
            } else {
                this.#constantNamespace.set(name, new Function(
                    info.arguments.map(
                        a => new Argument(new Type.String(), a.pbr, a.optional)
                    ),
                    new Type.String()
                ))
            }
        }
        for(const [name, info] of Object.entries(class_info)) {
            const c = new Type.Class(Context.pseudoQualify(name))
            for(const method of info.methods) {
                let collection
                if(method.isStatic) {
                    collection = c.classMethods
                } else {
                    collection = c.methods
                }
                const documented_info = function_type_info[`${name}::${method.name}`]
                debug(`${name}::${method.name} (${!!documented_info})`)
                if(documented_info) {
                    collection.set(
                        method.name,
                        new Type.Function(
                            documented_info.args.map(
                                a => new Argument(
                                    this.documentedType(a.type, "qn"),
                                    a.byReference,
                                    !!a.optionalDepth
                                )
                            ),
                            documented_info.returnTypes.reduce(
                                (carry, item) => {
                                    if(carry) {
                                        return carry.combinedWith(
                                            this.documentedType(item, "qn")
                                        )
                                    } else {
                                        return this.documentedType(item, "qn")
                                    }
                                },
                                null
                            )
                        )
                    )
                } else {
                    collection.set(
                        method.name,
                        new Type.Function(
                            method.arguments.map(
                                a => new Argument(
                                    this.documentedType(a.type, "qn"),
                                )
                            ),
                            this.documentedType(method.returnType, "qn")
                        )
                    )
                }
            }
            // constants
            // properties
            // interfaces
            // parentClass
            this.#constantNamespace.set(name, c)
        }
        for(const [name, info] of Object.entries(interface_info)) {
            const i = new Type.Class(Context.pseudoQualify(name))
            for(const method of info.methods) {
                let collection
                if(method.isStatic) {
                    collection = i.classMethods
                } else {
                    collection = i.methods
                }
                const documented_info = function_type_info[`${name}::${method.name}`]
                debug(`${name}::${method.name} (${!!documented_info})`)
                if(documented_info) {
                    collection.set(
                        method.name,
                        new Type.Function(
                            documented_info.args.map(
                                a => new Argument(
                                    this.documentedType(a.type, "qn"),
                                    a.byReference,
                                    !!a.optionalDepth
                                )
                            ),
                            documented_info.returnTypes.reduce(
                                (carry, item) => {
                                    if(carry) {
                                        return carry.combinedWith(
                                            this.documentedType(item, "qn")
                                        )
                                    } else {
                                        return this.documentedType(item, "qn")
                                    }
                                },
                                null
                            )
                        )
                    )
                } else {
                    collection.set(
                        method.name,
                        new Type.Function(
                            method.arguments.map(
                                a => new Argument(
                                    this.documentedType(a.type, "qn"),
                                )
                            ),
                            this.documentedType(method.returnType, "qn")
                        )
                    )
                }
            }
            // constants
            // properties
            // interfaces
            // parentClass
            this.#constantNamespace.set(name, i)
        }
    }

    /**
     * Checks a node, performing necessary state transitions
     *
     * @param node The node to check next
     */
    check(node) {
        debug(`Checking node of type ${node.kind}`)
        return Handlers[node.kind](node, this)
    }

    checkFile(filename) {
        return this.lint.checkFile(filename)
    }

    /**
     * Given a supplied documented type name, returns the counterpart type object.
     *
     * This does slightly more than namedType in that it supports fake types
     * like "mixed" and missing types.
     *
     * @param name eg. "\\Foo" (fqn), "Foo" (other)
     * @param resolution
     */
    documentedType(
        name,
        resolution
    ) {
        if(!name || name == "mixed" || name == "\\mixed") {
            return new Type.Mixed()
        } else if(name == "null" || name == "\\null") {
            return new Type.Null()
        } else {
            //@ts-ignore
            return this.namedType(name, resolution).instanceType
        }
    }

    /**
     * Find the symbol in whichever contextual namespace
     *
     * @param name eg. "$foo" or "Bar"
     */
    get(name) {
        if(name.match(/^[$]/)) {
            return this.#localNamespace.get(name)
        } else {
            const v = this.#constantNamespace.get(name)
            if(v === undefined) {
                this.lint.autoload(name)
                return this.#constantNamespace.get(name) || undefined
            } else {
                return v || undefined
            }
        }
    }
    /**
     * Returns true if the current (global) namespace has the given name.
     *
     * @param name eg. "$foo"
     */
    has(name) {
        return this.#constantNamespace.has(name) || this.#localNamespace.has(name)
    }

    /**
     * Adds a given alias.
     *
     * @param name eg "Foo\\Bar". No leading slash needed.
     * @param alias
     */
    importName(name, alias) {
        this.#aliases.set(
            alias || name.replace(/.*\\/, ""),
            Context.pseudoQualify(name)
        )
    }

    /**
     * Given a supplied actual type name, returns the counterpart type object.
     *
     * @param name eg. "\\Foo" (fqn), "Foo" (other)
     * @param resolution
     */
    namedType(name, resolution) {
        const qualified_type_name = this.qualifyName(name, resolution)
        switch(qualified_type_name) {
            case "\\array":
                return new Type.IndexedArray()
            case "\\bool":
                return new Type.Bool()
            case "\\callable":
                return new Type.Function([]) // FIXME
            case "\\false": // Sometimes used in doc
                return new Type.Bool(false)
            case "\\float":
                return new Type.Float()
            case "\\int":
                return new Type.Int()
            case "\\iterable":
            case "\\object":
                return new Type.Mixed() // FIXME
            case "\\string":
                return new Type.String()
            case "\\true": // Sometimes used in doc
                return new Type.Bool(false)
            default:
                const ref = Type.ClassInstance.classRef(qualified_type_name)
                return Type.Class.byRef(ref) || new Type.Class(qualified_type_name)
        }
    }

    /**
     * Checks a node, performing necessary state transitions
     *
     * @param node The node defining the assign target
     */
    noAssign(node) {
        const was_assigning = this.assigning
        this.assigning = null
        const r = Handlers[node.kind](node, this)
        this.assigning = was_assigning
        return r
    }

    /**
     * Given a supplied actual type name, returns the fully qualified name.
     *
     * Here, "fully qualified names" are ones which start with a "\\",
     * overriding the namespace context; the others (qualified, unqualified,
     * relative) refer in various ways to everything else.
     *
     * @param name eg. "\\Foo" (fqn), "Foo" (other)
     * @param resolution
     * @returns eg "\\Foo"
     */
    qualifyName(name, resolution) {
        if(resolution == "fqn" || name.match(/^[\\]/)) {
            return name
        } else if(this.#aliases.has(name)) {
            return this.#aliases.get(name)
        } else if(this.namespacePrefix) {
            return "\\" + this.namespacePrefix + "\\" + name
        } else {
            return Context.pseudoQualify(name)
        }
    }

    /**
     * Sets an entry in the current namespace.
     *
     * @param name eg. "$foo"
     * @param value
     */
    set(name, value) {
        this.#localNamespace.set(name, value)
    }

    /**
     * Sets an entry in the global namespace.
     *
     * @param name eg. "$foo"
     * @param value
     */
    setConstant(name, value) {
        this.#constantNamespace.set(name, value)
    }

    /**
     * Removes an entry in the current namespace.
     *
     * @param name eg. "$foo"
     */
    unset(name) {
        this.#localNamespace.delete(name)
    }
}