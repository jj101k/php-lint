import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { Base } from "./base";
export class String extends Base {
    protected node: NodeTypes.String
    constructor(node: NodeTypes.String) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.raw
        // this.node.value
        return true
    }
}