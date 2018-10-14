import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class Parenthesis extends Base {
    protected node: NodeTypes.Parenthesis
    constructor(node: NodeTypes.Parenthesis) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        context.check(this.node.inner)
        return true
    }
}
byKind.parenthesis = Parenthesis