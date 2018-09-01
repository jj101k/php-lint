import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class If extends Base {
    protected node: NodeTypes.If
    constructor(node: NodeTypes.If) {
        super(node)
        this.node = node
    }
    check(): boolean {
        if(this.node.alternate) {
            forNode(this.node.alternate).check()
        }
        forNode(this.node.body).check()
        forNode(this.node.test).check()
        // this.node.shortForm
        return true
    }
}