import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class Array extends Base {
    protected node: NodeTypes.Array
    constructor(node: NodeTypes.Array) {
        super(node)
        this.node = node
    }
    check(): boolean {
        this.node.items.forEach(
            i => forNode(i).check()
        )
        return true
    }
}