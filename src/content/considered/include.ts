import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
import { Context } from "../../context";
export class Include extends Base {
    protected node: NodeTypes.Include
    constructor(node: NodeTypes.Include) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.once
        // this.node.require
        forNode(this.node.target).check(context)
        return true
    }
}