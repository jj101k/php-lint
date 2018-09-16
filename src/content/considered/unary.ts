import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode, byKind } from "./for-node";
import { Base } from "./base";
class Unary extends Base {
    protected node: NodeTypes.Unary
    constructor(node: NodeTypes.Unary) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.type
        forNode(this.node.what).check(context)
        return true
    }
}
byKind.unary = Unary