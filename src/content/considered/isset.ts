import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode, byKind } from "./for-node";
import { Base } from "./base";
class Isset extends Base {
    protected node: NodeTypes.Isset
    constructor(node: NodeTypes.Isset) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.arguments.forEach(
            n => forNode(n).check(context)
        )
        return true
    }
}
byKind.isset = Isset