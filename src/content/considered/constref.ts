import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
import { Context } from "../../context";
export class ConstRef extends Base {
    protected node: NodeTypes.ConstRef
    constructor(node: NodeTypes.ConstRef) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.name
        return true
    }
}