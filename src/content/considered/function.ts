import { Context } from "../../context";
import * as Known from "../../type/known";
import { Argument } from "../../type/known/function";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class Function extends Base {
    protected node: NodeTypes.Function
    constructor(node: NodeTypes.Function) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        const inner_context = new Context()
        this.node.arguments.forEach(
            a => inner_context.check(a)
        )
        if(this.node.body) {
            inner_context.check(this.node.body)
        }
        context.set(this.node.name, new Known.Function(
            this.node.arguments.map(a => new Argument(new Known.Base(), a.byref)),
            // FIXME return
        ))
        // this.node.byref
        // this.node.nullable
        return true
    }
}
byKind.function = Function