import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode } from "./for-node";
import { Base } from "./base";
export class Call extends Base {
    protected node: NodeTypes.Call
    constructor(node: NodeTypes.Call) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        if(this.node.what) {
            forNode(this.node.what).check(context)
        }
        this.node.arguments.forEach(
            a => forNode(a).check(context)
        )
        return true
    }
}