import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class Assign extends Base {
    protected node: NodeTypes.Assign
    constructor(node: NodeTypes.Assign) {
        super(node)
        this.node = node
    }
    check(): boolean {
        forNode(this.node.left).check()
        forNode(this.node.right).check()
        return true
    }
}