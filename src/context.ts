import * as Inferred from "./type/inferred";
import * as Known from "./type/known";
import * as Type from "./type"
import { Function, Argument } from "./type/known/function";
import { NodeTypes } from "./content/ast";
import { checkForNode } from "./content/considered/for-node";

export class Context {
    private globalNamespace: Map<string, Type.Base>
    public assigning: Type.Base | null = null
    public realReturnTypes: Type.Base[] = []
    public returnType: Type.Base | null = null
    constructor(from_context?: Context) {
        if(from_context) {
            this.globalNamespace = from_context.globalNamespace
        } else {
            this.globalNamespace = new Map()
            this.globalNamespace.set("preg_match", new Function([
                new Argument(new Inferred.Mixed(), false),
                new Argument(new Inferred.Mixed(), false),
                new Argument(new Inferred.Mixed(), true),
            ], new Inferred.Mixed()))
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
    get(name: string): Type.Base | undefined {
        return this.globalNamespace.get(name)
    }
    /**
     * Returns true if the current (global) namespace has the given name.
     *
     * @param name eg. "$foo"
     */
    has(name: string): boolean {
        return this.globalNamespace.has(name)
    }

    /**
     *
     * @param name
     * @param resolution
     */
    namedType(name: string, resolution: "fqn" | "qn" | "uqn" | "rn"): Type.Base {
        let qualified_type_name: string
        if(resolution == "fqn") {
            qualified_type_name = name
        } else {
            qualified_type_name = "\\" + name
        }
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
     * Sets an entry in the current (global) namespace.
     *
     * @param name eg. "$foo"
     * @param value
     */
    set(name: string, value: Type.Base) {
        this.globalNamespace.set(name, value)
    }
}