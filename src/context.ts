import * as Type from "./type"
import { Function, Argument } from "./type/function";
import { NodeTypes } from "./content/ast";
import { checkForNode } from "./content/considered/for-node";
import {FunctionTypeInfo} from "./build"
import Lint from "./lint";

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
    static pseudoQualify(name: string): string {
        if(name[0] == "\\") {
            return name
        } else {
            return "\\" + name
        }
    }
    private aliases: Map<string, string> = new Map()
    /**
     * This is where functions go, as well as explicit constants. These get
     * inherited everywhere.
     */

    /**
     * Contains all constants, including null for any which failed autoload
     */
    private constantNamespace: Map<string, Type.Base | null>

    private globalNamespace: Map<string, Type.Base>
    /**
     * Stuff that has been defined here, ie variables
     */
    private localNamespace: Map<string, Type.Base>

    public assigning: Type.Base | null = null
    public namespacePrefix: string | null = null
    public lint: Lint | null = null
    public realReturnType: Type.Base | null = null
    public returnType: Type.Base | null = null
    constructor(from_context?: Context) {
        this.localNamespace = new Map()
        if(from_context) {
            this.constantNamespace = from_context.constantNamespace
            this.globalNamespace = from_context.globalNamespace
            this.lint = from_context.lint
        } else {
            this.globalNamespace = new Map()
            this.constantNamespace = new Map()
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
        node: NodeTypes.Node,
        test: boolean,
        message: string = "Invalid syntax",
    ): void {
        if(!test) {
            if(node.loc) {
                throw new Error(
                    `Line ${node.loc.start.line} column ${node.loc.start.column}: ` +
                        message
                )
            } else {
                throw new Error(message)
            }
        }
    }

    /**
     * Adds all known global symbols to the constant namespace
     */
    buildGlobalSymbols(): void {
        const fs = require("fs")
        const function_info: {
            [name: string]: {arguments: {optional: boolean, pbr: boolean}[]}
        } = JSON.parse(
            fs.readFileSync(__dirname + "/../data/php-functions.json")
        )
        const class_info: {
            [name: string]: {
                constants: {name: string, isPublic: boolean, value: any}[],
                methods: {
                    name: string,
                    isAbstract: boolean,
                    isPublic: boolean,
                    isStatic: boolean,
                    arguments: {type: string|null}[],
                    returnType: string | null,
                }[],
                properties: {name: string, isPublic: boolean, isStatic: boolean}[],
                interfaces: string[],
                parentClass: string | null,
            }
        } = JSON.parse(
            fs.readFileSync(__dirname + "/../data/php-classes.json")
        )
        const function_type_info: {[name: string]: FunctionTypeInfo} = JSON.parse(
            fs.readFileSync(__dirname + "/../data/php-function-types.json")
        )
        for(const [name, info] of Object.entries(function_info)) {
            const documented_info = function_type_info[name]
            if(documented_info) {
                this.constantNamespace.set(name, new Function(
                    documented_info.args.map(
                        a => new Argument(
                            this.documentedType(a.type, "qn"),
                            a.byReference,
                            !!a.optionalDepth
                        )
                    ),
                    documented_info.returnTypes.reduce(
                        (carry: Type.Base | null, item): Type.Base => {
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
                this.constantNamespace.set(name, new Function(
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
                let collection: Map<string, Type.Function>
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
                                (carry: Type.Base | null, item): Type.Base => {
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
            this.constantNamespace.set(name, c)
        }
    }

    /**
     * Checks a node, performing necessary state transitions
     *
     * @param node The node to check next
     * @param assigning A type, if this starts an assignment
     */
    check(node: NodeTypes.Node, assigning: Type.Base | null = null): Type.Base {
        if(assigning !== null && assigning != this.assigning) {
            const was_assigning = this.assigning
            this.assigning = assigning
            const r = checkForNode(this, node)
            this.assigning = was_assigning
            return r
        } else {
            return checkForNode(this, node)
        }
    }

    checkFile(filename: string): boolean | null {
        return this.lint!.checkFile(filename)
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
        name: string | null,
        resolution: "fqn" | "qn" | "uqn" | "rn"
    ): Type.Base {
        if(!name || name == "mixed" || name == "\\mixed") {
            return new Type.Mixed()
        } else if(name == "null" || name == "\\null") {
            return new Type.Null()
        } else {
            return this.namedType(name, resolution)
        }
    }

    /**
     * Find the symbol in whichever contextual namespace
     *
     * @param name eg. "$foo" or "Bar"
     */
    get(name: string): Type.Base | undefined {
        if(name.match(/^[$]/)) {
            return this.localNamespace.get(name)
        } else {
            return this.constantNamespace.get(name) || undefined
        }
    }
    /**
     * Returns true if the current (global) namespace has the given name.
     *
     * @param name eg. "$foo"
     */
    has(name: string): boolean {
        return this.constantNamespace.has(name) || this.localNamespace.has(name)
    }

    /**
     * Adds a given alias.
     *
     * @param name eg "Foo\\Bar". No leading slash needed.
     * @param alias
     */
    importName(name: string, alias: string | null): void {
        this.aliases.set(
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
    namedType(name: string, resolution: "fqn" | "qn" | "uqn" | "rn"): Type.Base {
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
                return new Type.ClassInstance(
                    Type.ClassInstance.classRef(qualified_type_name)
                )
        }
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
    qualifyName(name: string, resolution: "fqn" | "qn" | "uqn" | "rn"): string {
        if(resolution == "fqn" || name.match(/^[\\]/)) {
            return name
        } else if(this.aliases.has(name)) {
            return this.aliases.get(name)!
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
    set(name: string, value: Type.Base) {
        this.localNamespace.set(name, value)
    }

    /**
     * Sets an entry in the global namespace.
     *
     * @param name eg. "$foo"
     * @param value
     */
    setConstant(name: string, value: Type.Base | null) {
        this.constantNamespace.set(name, value)
    }
}