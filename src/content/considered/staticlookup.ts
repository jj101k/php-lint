import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class StaticLookup extends Base {
    protected node: NodeTypes.StaticLookup
    constructor(node: NodeTypes.StaticLookup) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        context.check(this.node.what)
        context.check(this.node.offset)
        return true
    }
}
byKind.staticlookup = StaticLookup