import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class Property extends Base {
    protected node: NodeTypes.Property
    constructor(node: NodeTypes.Property) {
        super(node)
        this.node = node
    }
    check(): boolean {
        // this.node.isFinal
        // this.node.isStatic
        // this.node.name
        if(this.node.value) {
            forNode(this.node.value).check()
        }
        // this.node.visibility
        return true
    }
}