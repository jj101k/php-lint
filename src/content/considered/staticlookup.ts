import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class StaticLookup extends Base {
    protected node: NodeTypes.StaticLookup
    constructor(node: NodeTypes.StaticLookup) {
        super(node)
        this.node = node
    }
    check(): boolean {
        forNode(this.node.what).check()
        forNode(this.node.offset).check()
        return true
    }
}