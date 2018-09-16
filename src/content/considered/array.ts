import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { forNode } from "./for-node";
import { Base } from "./base";
export class Array extends Base {
    protected node: NodeTypes.Array
    constructor(node: NodeTypes.Array) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.items.forEach(
            i => forNode(i).check(context)
        )
        return true
    }
}