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
        const was_assigning = context.assigning
        context.assigning = true
        forNode(this.node.left).check(context)
        forNode(this.node.right).check(context)
        context.assigning = was_assigning
        return true
    }
}
byKind.assign = Assign