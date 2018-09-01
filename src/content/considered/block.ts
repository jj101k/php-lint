import { Base } from "./base";
import { forNode } from "../considered";
import { NodeTypes } from "../ast";
export class Block extends Base {
    protected node: NodeTypes.Block
    constructor(node: NodeTypes.Block) {
        super(node)
        this.node = node
    }
    check(): boolean {
        this.node.children.forEach(
            child => forNode(child).check()
        )
        return true
    }
}