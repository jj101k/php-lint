import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Considered } from "../considered";
export class Array extends Considered.Base {
    protected node: NodeTypes.Array
    constructor(node: NodeTypes.Array) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.items.forEach(
            i => Considered.forNode(i).check(context)
        )
        return true
    }
}