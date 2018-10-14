import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class Array extends Base {
    protected node: NodeTypes.Array
    constructor(node: NodeTypes.Array) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.items.forEach(i => context.check(i))
        return true
    }
}
byKind.array = Array