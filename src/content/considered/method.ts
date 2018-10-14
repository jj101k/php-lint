import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class Method extends Base {
    protected node: NodeTypes.Method
    constructor(node: NodeTypes.Method) {
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