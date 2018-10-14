import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
export class If extends Base {
    protected node: NodeTypes.If
    constructor(node: NodeTypes.If) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        if(this.node.alternate) {
            context.check(this.node.alternate)
        }
        context.check(this.node.body)
        context.check(this.node.test)
        // this.node.shortForm
        return true
    }
}
byKind.if = If