import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class Unary extends Base {
    protected node: NodeTypes.Unary
    constructor(node: NodeTypes.Unary) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.type
        context.check(this.node.what)
        return true
    }
}
byKind.unary = Unary