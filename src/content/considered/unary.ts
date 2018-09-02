import { Base } from "./base";
import { NodeTypes } from "../ast";
import { Considered } from "../considered";
import { Context } from "../../context";
export class Unary extends Base {
    protected node: NodeTypes.Unary
    constructor(node: NodeTypes.Unary) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.type
        Considered.forNode(this.node.what).check(context)
        return true
    }
}