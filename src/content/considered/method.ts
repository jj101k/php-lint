import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode, byKind } from "./for-node";
import { Base } from "./base";
class Method extends Base {
    protected node: NodeTypes.Method
    constructor(node: NodeTypes.Method) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        const inner_context = new Context()
        this.node.arguments.forEach(
            a => forNode(a).check(inner_context)
        )
        if(this.node.body) {
            forNode(this.node.body).check(inner_context)
        }
        // this.node.byref
        // this.node.nullable
        // this.node.isAbstract
        // this.node.isFinal
        // this.node.isStatic
        // this.node.visibility
        return true
    }
}
byKind.method = Method