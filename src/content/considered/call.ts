import { Context } from "../../context";
import * as Known from "../../type/known";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class Call extends Base {
    protected node: NodeTypes.Call
    constructor(node: NodeTypes.Call) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        let function_type: Known.Function
        if(this.node.what) {
            context.check(this.node.what)
            if(typeof this.node.what.name == "string") {
                const type = context.get(this.node.what.name)
                if(type instanceof Known.Function) {
                    function_type = type
                }
            }
        }
        this.node.arguments.forEach((a, i) => {
            if(function_type && function_type.args[i] && function_type.args[i].byRef) {
                context.assigning = true
                context.check(a)
                context.assigning = false
            } else {
                context.check(a)
            }
        })
        return true
    }
}
byKind.call = Call