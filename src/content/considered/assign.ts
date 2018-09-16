import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode, byKind } from "./for-node";
import { Base } from "./base";
class Assign extends Base {
    protected node: NodeTypes.Assign
    constructor(node: NodeTypes.Assign) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        forNode(this.node.left).check(context)
        forNode(this.node.right).check(context)
        return true
    }
}
byKind.assign = Assign