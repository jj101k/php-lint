import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class Assign extends Base {
    protected node: NodeTypes.Assign
    constructor(node: NodeTypes.Assign) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        context.check(this.node.left, true)
        context.check(this.node.right)
        return true
    }
}
byKind.assign = Assign