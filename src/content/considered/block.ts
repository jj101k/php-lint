import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class Block extends Base {
    protected node: NodeTypes.Block
    constructor(node: NodeTypes.Block) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.children.forEach(
            child => context.check(child)
        )
        return true
    }
}
byKind.block = Block