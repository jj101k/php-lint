import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
import { Context } from "../../context";
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