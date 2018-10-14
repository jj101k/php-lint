import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class Include extends Base {
    protected node: NodeTypes.Include
    constructor(node: NodeTypes.Include) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.once
        // this.node.require
        context.check(this.node.target)
        return true
    }
}
byKind.include = Include