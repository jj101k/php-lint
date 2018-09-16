import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode } from "./for-node";
import { Base } from "./base";
export class Bin extends Base {
    protected node: NodeTypes.Bin
    constructor(node: NodeTypes.Bin) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.type
        forNode(this.node.left).check(context)
        forNode(this.node.right).check(context)
        return true
    }
}