import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class Foreach extends Base {
    protected node: NodeTypes.Foreach
    constructor(node: NodeTypes.Foreach) {
        super(node)
        this.node = node
    }
    check(): boolean {
        forNode(this.node.body).check()
        if(this.node.key) {
            forNode(this.node.key).check()
        }
        // this.node.shortForm
        forNode(this.node.source).check()
        forNode(this.node.value).check()
        return true
    }
}