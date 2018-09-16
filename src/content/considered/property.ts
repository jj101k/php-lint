import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode } from "./for-node";
import { Base } from "./base";
export class Property extends Base {
    protected node: NodeTypes.Property
    constructor(node: NodeTypes.Property) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.isFinal
        // this.node.isStatic
        // this.node.name
        if(this.node.value) {
            forNode(this.node.value).check(context)
        }
        // this.node.visibility
        return true
    }
}