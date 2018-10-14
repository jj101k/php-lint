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
        const was_assigning = context.assigning
        context.assigning = true
        context.check(this.node.left)
        context.check(this.node.right)
        context.assigning = was_assigning
        return true
    }
}
byKind.assign = Assign