import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode } from "./for-node";
import { Base } from "./base";
export class Closure extends Base {
    protected node: NodeTypes.Closure
    constructor(node: NodeTypes.Closure) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.arguments.forEach(
            a => forNode(a).check(context)
        )
        forNode(this.node.body).check(context)
        // this.node.byref
        // this.node.isStatic
        // this.node.nullable
        this.node.uses.forEach(
            u => forNode(u).check(context)
        )
        return true
    }
}