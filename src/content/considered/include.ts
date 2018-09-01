import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class Include extends Base {
    protected node: NodeTypes.Include
    constructor(node: NodeTypes.Include) {
        super(node)
        this.node = node
    }
    check(): boolean {
        // this.node.once
        // this.node.require
        forNode(this.node.target).check()
        return true
    }
}