import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class Bin extends Base {
    protected node: NodeTypes.Bin
    constructor(node: NodeTypes.Bin) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.type
        context.check(this.node.left)
        context.check(this.node.right)
        return true
    }
}
byKind.bin = Bin