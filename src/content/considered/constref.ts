import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { Base } from "./base";
export class ConstRef extends Base {
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