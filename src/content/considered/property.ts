import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
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
            context.check(this.node.value)
        }
        // this.node.visibility
        return true
    }
}
byKind.property = Property