import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class New extends Base {
    protected node: NodeTypes.New
    constructor(node: NodeTypes.New) {
        super(node)
        this.node = node
    }
    check(): boolean {
        forNode(this.node.what).check()
        this.node.arguments.forEach(
            a => forNode(a).check()
        )
        return true
    }
}