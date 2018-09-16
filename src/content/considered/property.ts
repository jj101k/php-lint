import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode, byKind } from "./for-node";
import { Base } from "./base";
class Property extends Base {
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
byKind.property = Property