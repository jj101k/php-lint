import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode, byKind } from "./for-node";
import { Base } from "./base";
class Include extends Base {
    protected node: NodeTypes.Include
    constructor(node: NodeTypes.Include) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.once
        // this.node.require
        forNode(this.node.target).check(context)
        return true
    }
}
byKind.include = Include