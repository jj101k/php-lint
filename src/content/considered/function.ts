import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode, byKind } from "./for-node";
import { Base } from "./base";
import { Known } from "../../type/known";
import { Argument, Function as KFunction } from "../../type/known/function";
class Function extends Base {
    protected node: NodeTypes.Function
    constructor(node: NodeTypes.Function) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.arguments.forEach(
            a => forNode(a).check(context)
        )
        if(this.node.body) {
            forNode(this.node.body).check(context)
        }
        context.set(this.node.name, new KFunction(
            this.node.arguments.map(a => new Argument(new Known(), a.byref)),
            // FIXME return
        ))
        // this.node.byref
        // this.node.nullable
        return true
    }
}
byKind.function = Function