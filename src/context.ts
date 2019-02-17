import * as Inferred from "./type/inferred";
import * as Known from "./type/known";
import * as Type from "./type"
import { Function, Argument } from "./type/known/function";
import { NodeTypes } from "./content/ast";
import { checkForNode } from "./content/considered/for-node";
import {FunctionTypeInfo} from "./build"

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
    /**
     * This is where functions go, as well as explicit constants. These get
     * inherited everywhere.
     */
    private constantNamespace: Map<string, Type.Base>
    private globalNamespace: Map<string, Type.Base>
    /**
     * Stuff that has been defined here, ie variables
     */
    private localNamespace: Map<string, Type.Base>

    public assigning: Type.Base | null = null
    public realReturnTypes: Type.Base[] = []
    public returnType: Type.Base | null = null
    constructor(from_context?: Context) {
        this.localNamespace = new Map()
        if(from_context) {
            this.constantNamespace = from_context.constantNamespace
            this.globalNamespace = from_context.globalNamespace
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
    assert(node: NodeTypes.Node, test: boolean, message: string = "Invalid syntax"): void {
        if(!test) {
            if(node.loc) {
                throw new Error(
                    `Line ${node.loc.start.line} column ${node.loc.start.column}: ${message}`
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
        const function_info: {[name: string]: {arguments: {optional: boolean, pbr: boolean}[]}} = JSON.parse(
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
                properties: {name: string, isPublic: boolean, isStatic: boolean}[], interfaces: string[],
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
                    documented_info.returnTypes.map(
                        t => this.documentedType(t, "qn")
                    )
                ))
            } else {
                this.constantNamespace.set(name, new Function(
                    info.arguments.map(
                        a => new Argument(new Known.String(), a.pbr, a.optional)
                    ),
                    [new Known.String()]
                ))
            }
        }
        for(const [name, info] of Object.entries(class_info)) {
            const c = new Known.Class(Context.pseudoQualify(name))
            for(const method of info.methods) {
                const documented_info = function_type_info[`${name}::${method.name}`]
                if(documented_info) {
                    c.methods.set(
                        method.name,
                        new Known.Function(
                            documented_info.args.map(
                                a => new Argument(
                                    this.documentedType(a.type, "qn"),
                                    a.byReference,
                                    !!a.optionalDepth
                                )
                            ),
                            documented_info.returnTypes.map(
                                t => this.documentedType(t, "qn")
                            )
                        )
                    )
                } else {
                    c.methods.set(
                        method.name,
                        new Known.Function(
                            method.arguments.map(
                                a => new Argument(
                                    this.documentedType(a.type, "qn"),
                                )
                            ),
                            [this.documentedType(method.returnType, "qn")]
                        )
                    )
                }
            }
            // constants
            // properties
            // interfaces
            // parentClass
        }
    }

    /**
     * Checks a node, performing necessary state transitions
     *
     * @param node The node to check next
     * @param assigning A type, if this starts an assignment
     */
    check(node: NodeTypes.Node, assigning: Type.Base | null = null): Array<Type.Base> {
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
            return new Inferred.Mixed()
        } else {
            return this.namedType(name, resolution)
        }
    }
    get(name: string): Type.Base | undefined {
        return this.constantNamespace.get(name) || this.localNamespace.get(name)
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
     * Given a supplied actual type name, returns the counterpart type object.
     *
     * @param name eg. "\\Foo" (fqn), "Foo" (other)
     * @param resolution
     */
    namedType(name: string, resolution: "fqn" | "qn" | "uqn" | "rn"): Type.Base {
        const qualified_type_name = this.qualifyName(name, resolution)
        switch(qualified_type_name) {
            case "\\array":
                return new Known.IndexedArray()
            case "\\bool":
                return new Known.Bool()
            case "\\callable":
                return new Known.Function([]) // FIXME
            case "\\float":
                return new Known.Float()
            case "\\int":
                return new Known.Int()
            case "\\iterable":
            case "\\object":
                return new Inferred.Mixed() // FIXME
            case "\\string":
                return new Known.String()
            default:
                return new Known.ClassInstance(Inferred.ClassInstance.classRef(qualified_type_name))
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
        } else {
            return "\\" + name
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
    setConstant(name: string, value: Type.Base) {
        this.constantNamespace.set(name, value)
    }
}