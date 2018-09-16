import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode, byKind } from "./for-node";
import { Base } from "./base";
class StaticLookup extends Base {
    protected node: NodeTypes.StaticLookup
    constructor(node: NodeTypes.StaticLookup) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        forNode(this.node.what).check(context)
        forNode(this.node.offset).check(context)
        return true
    }
}
byKind.staticlookup = StaticLookup