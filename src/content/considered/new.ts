import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode, byKind } from "./for-node";
import { Base } from "./base";
class New extends Base {
    protected node: NodeTypes.New
    constructor(node: NodeTypes.New) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        forNode(this.node.what).check(context)
        this.node.arguments.forEach(
            a => forNode(a).check(context)
        )
        return true
    }
}
byKind.new = New