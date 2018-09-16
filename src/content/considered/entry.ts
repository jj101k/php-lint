import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode, byKind } from "./for-node";
import { Base } from "./base";
class Entry extends Base {
    protected node: NodeTypes.Entry
    constructor(node: NodeTypes.Entry) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        if(this.node.key) {
            forNode(this.node.key).check(context)
        }
        forNode(this.node.value).check(context)
        return true
    }
}
byKind.entry = Entry