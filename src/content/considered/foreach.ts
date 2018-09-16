import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode, byKind } from "./for-node";
import { Base } from "./base";
class Foreach extends Base {
    protected node: NodeTypes.Foreach
    constructor(node: NodeTypes.Foreach) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        forNode(this.node.body).check(context)
        if(this.node.key) {
            forNode(this.node.key).check(context)
        }
        // this.node.shortForm
        forNode(this.node.source).check(context)
        forNode(this.node.value).check(context)
        return true
    }
}
byKind.foreach = Foreach