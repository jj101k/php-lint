import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class Unary extends Base {
    protected node: NodeTypes.Unary
    constructor(node: NodeTypes.Unary) {
        super(node)
        this.node = node
    }
    check(): boolean {
        // this.node.type
        forNode(this.node.what).check()
        return true
    }
}