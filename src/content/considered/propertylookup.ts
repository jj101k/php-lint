import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class PropertyLookup extends Base {
    protected node: NodeTypes.PropertyLookup
    constructor(node: NodeTypes.PropertyLookup) {
        super(node)
        this.node = node
    }
    check(): boolean {
        forNode(this.node.what).check()
        forNode(this.node.offset).check()
        return true
    }
}