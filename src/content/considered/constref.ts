import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { Base } from "./base";
import { byKind } from "./for-node";
class ConstRef extends Base {
    protected node: NodeTypes.ConstRef
    constructor(node: NodeTypes.ConstRef) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.name
        return true
    }
}
byKind.constref = ConstRef