import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode, byKind } from "./for-node";
import { Base } from "./base";
class Block extends Base {
    protected node: NodeTypes.Block
    constructor(node: NodeTypes.Block) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.children.forEach(
            child => forNode(child).check(context)
        )
        return true
    }
}
byKind.block = Block