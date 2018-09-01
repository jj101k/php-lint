import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class Bin extends Base {
    protected node: NodeTypes.Bin
    constructor(node: NodeTypes.Bin) {
        super(node)
        this.node = node
    }
    check(): boolean {
        // this.node.type
        forNode(this.node.left).check()
        forNode(this.node.right).check()
        return true
    }
}