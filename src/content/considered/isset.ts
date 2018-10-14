import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class Isset extends Base {
    protected node: NodeTypes.Isset
    constructor(node: NodeTypes.Isset) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.arguments.forEach(
            n => context.check(n)
        )
        return true
    }
}
byKind.isset = Isset