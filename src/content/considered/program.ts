import { Base } from "./base";
import { forNode } from "../considered";
import { NodeTypes } from "../ast";
export class Program extends Base {
    protected node: NodeTypes.Program
    constructor(node: NodeTypes.Program) {
        super(node)
        this.node = node
    }
    check(): boolean {
        this.node.children.forEach(
            child => forNode(child).check()
        )
        return true
    }
}