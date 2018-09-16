import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { Base } from "./base";
export class Return extends Base {
    protected node: NodeTypes.Return
    constructor(node: NodeTypes.Return) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.raw
        // this.node.value
        return true
    }
}