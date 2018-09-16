import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { Base } from "./base";
import { byKind } from "./for-node";
class Number extends Base {
    protected node: NodeTypes.Number
    constructor(node: NodeTypes.Number) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.raw
        // this.node.value
        return true
    }
}
byKind.number = Number