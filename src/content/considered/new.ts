import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class New extends Base {
    protected node: NodeTypes.New
    constructor(node: NodeTypes.New) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        context.check(this.node.what)
        this.node.arguments.forEach(
            a => context.check(a)
        )
        return true
    }
}
byKind.new = New