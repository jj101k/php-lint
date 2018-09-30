import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode, byKind } from "./for-node";
import { Base } from "./base";
import { Function } from "../../type/known/function";
import { Known } from "../../type/known";
class Call extends Base {
    protected node: NodeTypes.Call
    constructor(node: NodeTypes.Call) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        let function_type: Function
        if(this.node.what) {
            forNode(this.node.what).check(context)
            if(typeof this.node.what.name == "string") {
                const type = context.get(this.node.what.name)
                if(type instanceof Function) {
                    function_type = type
                }
            }
        }
        this.node.arguments.forEach((a, i) => {
            if(function_type && function_type.args[i] && function_type.args[i].byRef) {
                context.assigning = true
                forNode(a).check(context)
                context.assigning = false
            } else {
                forNode(a).check(context)
            }
        })
        return true
    }
}
byKind.call = Call