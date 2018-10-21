import * as Known from "./type/known";
import { Function, Argument } from "./type/known/function";
import { NodeTypes } from "./content/ast";
import { checkForNode } from "./content/considered/for-node";

export class Context {
    private globalNamespace: Map<string, Known.Base>
    public assigning: boolean = false
    constructor(from_context?: Context) {
        if(from_context) {
            this.globalNamespace = from_context.globalNamespace
        } else {
            this.globalNamespace = new Map()
            this.globalNamespace.set("preg_match", new Function([
                new Argument(new Known.Base(), false),
                new Argument(new Known.Base(), false),
                new Argument(new Known.Base(), true),
            ], new Known.Base()))
        }
    }
    /**
     * Checks a node, performing necessary state transitions
     *
     * @param node The node to check next
     * @param assigning True if this starts an assignment
     */
    check(node: NodeTypes.Node, assigning: boolean | null = null): boolean {
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
     * @param test A simple true/false value
     * @param message Optional message to describe what assertion failure means
     * @throws {Error} Invalid syntax
     */
    assert(test: boolean, message: string = "Invalid syntax"): void {
        if(!test) {
            throw new Error(message)
        }
    }
    get(name: string): Known.Base | undefined {
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
     * Sets an entry in the current (global) namespace.
     *
     * @param name eg. "$foo"
     * @param value
     */
    set(name: string, value: Known.Base) {
        this.globalNamespace.set(name, value)
    }
}