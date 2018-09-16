import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { Base } from "./base";
export class Boolean extends Base {
    protected node: NodeTypes.Boolean
    constructor(node: NodeTypes.Boolean) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.raw
        // this.node.value
        return true
    }
}