import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode, byKind } from "./for-node";
import { Base } from "./base";
class Closure extends Base {
    protected node: NodeTypes.Closure
    constructor(node: NodeTypes.Closure) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        const inner_context = new Context()
        this.node.arguments.forEach(
            a => forNode(a).check(inner_context)
        )
        // this.node.byref
        // this.node.isStatic
        // this.node.nullable
        inner_context.assigning = true
        this.node.uses.forEach(
            u => forNode(u).check(inner_context)
        )
        inner_context.assigning = false
        forNode(this.node.body).check(inner_context)
        return true
    }
}
byKind.closure = Closure