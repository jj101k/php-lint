import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode, byKind } from "./for-node";
import { Base } from "./base";
class Parenthesis extends Base {
    protected node: NodeTypes.Parenthesis
    constructor(node: NodeTypes.Parenthesis) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        forNode(this.node.inner).check(context)
        return true
    }
}
byKind.parenthesis = Parenthesis