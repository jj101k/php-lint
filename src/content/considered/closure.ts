import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class Closure extends Base {
    protected node: NodeTypes.Closure
    constructor(node: NodeTypes.Closure) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        const inner_context = new Context()
        this.node.arguments.forEach(
            a => inner_context.check(a)
        )
        // this.node.byref
        // this.node.isStatic
        // this.node.nullable
        inner_context.assigning = true
        this.node.uses.forEach(
            u => inner_context.check(u)
        )
        inner_context.assigning = false
        inner_context.check(this.node.body)
        return true
    }
}
byKind.closure = Closure