import { Context } from "../../context";
import * as Known from "../../type/known";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
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
            context.check(this.node.type)
        }
        if(this.node.value) {
            context.check(this.node.value)
        }
        // this.node.variadic
        context.set("$" + this.node.name, new Known.Base())
        return true
    }
}
byKind.parameter = Parameter