import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode } from "./for-node";
import { Base } from "./base";
export class Block extends Base {
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