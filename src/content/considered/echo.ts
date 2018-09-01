import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class Echo extends Base {
    protected node: NodeTypes.Echo
    constructor(node: NodeTypes.Echo) {
        super(node)
        this.node = node
    }
    check(): boolean {
        this.node.arguments.forEach(
            n => forNode(n).check()
        )
        return true
    }
}