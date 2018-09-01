import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class Function extends Base {
    protected node: NodeTypes.Function
    constructor(node: NodeTypes.Function) {
        super(node)
        this.node = node
    }
    check(): boolean {
        this.node.arguments.forEach(
            a => forNode(a).check()
        )
        if(this.node.body) {
            forNode(this.node.body).check()
        }
        // this.node.byref
        // this.node.nullable
        return true
    }
}