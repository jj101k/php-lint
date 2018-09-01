import { Base } from "./base";
import { NodeTypes } from "../ast";
import { Context } from "../../context";
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