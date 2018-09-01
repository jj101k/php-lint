import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class Call extends Base {
    protected node: NodeTypes.Call
    constructor(node: NodeTypes.Call) {
        super(node)
        this.node = node
    }
    check(): boolean {
        if(this.node.what) {
            forNode(this.node.what).check()
        }
        this.node.arguments.forEach(
            a => forNode(a).check()
        )
        return true
    }
}