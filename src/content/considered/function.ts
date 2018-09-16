import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode } from "./for-node";
import { Base } from "./base";
export class Function extends Base {
    protected node: NodeTypes.Function
    constructor(node: NodeTypes.Function) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.arguments.forEach(
            a => forNode(a).check(context)
        )
        if(this.node.body) {
            forNode(this.node.body).check(context)
        }
        // this.node.byref
        // this.node.nullable
        return true
    }
}