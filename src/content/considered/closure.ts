import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class Closure extends Base {
    protected node: NodeTypes.Closure
    constructor(node: NodeTypes.Closure) {
        super(node)
        this.node = node
    }
    check(): boolean {
        this.node.arguments.forEach(
            a => forNode(a).check()
        )
        forNode(this.node.body).check()
        // this.node.byref
        // this.node.isStatic
        // this.node.nullable
        this.node.uses.forEach(
            u => forNode(u).check()
        )
        return true
    }
}