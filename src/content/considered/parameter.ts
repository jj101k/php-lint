import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode, byKind } from "./for-node";
import { Base } from "./base";
import { Known } from "../../type/known";
class Parameter extends Base {
    protected node: NodeTypes.Parameter
    constructor(node: NodeTypes.Parameter) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.byref
        // this.node.nullable
        if(this.node.type) {
            forNode(this.node.type).check(context)
        }
        if(this.node.value) {
            forNode(this.node.value).check(context)
        }
        // this.node.variadic
        context.set("$" + this.node.name, new Known())
        return true
    }
}
byKind.parameter = Parameter