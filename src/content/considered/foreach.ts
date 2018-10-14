import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class Foreach extends Base {
    protected node: NodeTypes.Foreach
    constructor(node: NodeTypes.Foreach) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        context.check(this.node.body)
        if(this.node.key) {
            context.assigning = true
            context.check(this.node.key)
            context.assigning = false
        }
        // this.node.shortForm
        context.check(this.node.source)
        context.assigning = true
        context.check(this.node.value)
        context.assigning = false
        return true
    }
}
byKind.foreach = Foreach