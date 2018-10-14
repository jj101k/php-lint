import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class Echo extends Base {
    protected node: NodeTypes.Echo
    constructor(node: NodeTypes.Echo) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.arguments.forEach(
            n => context.check(n)
        )
        // this.node.shortForm
        return true
    }
}
byKind.echo = Echo