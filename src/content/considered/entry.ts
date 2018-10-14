import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class Entry extends Base {
    protected node: NodeTypes.Entry
    constructor(node: NodeTypes.Entry) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        if(this.node.key) {
            context.check(this.node.key)
        }
        context.check(this.node.value)
        return true
    }
}
byKind.entry = Entry