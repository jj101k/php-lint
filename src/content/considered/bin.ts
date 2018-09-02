import { Base } from "./base";
import { NodeTypes } from "../ast";
import { Considered } from "../considered";
import { Context } from "../../context";
export class Bin extends Base {
    protected node: NodeTypes.Bin
    constructor(node: NodeTypes.Bin) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.type
        Considered.forNode(this.node.left).check(context)
        Considered.forNode(this.node.right).check(context)
        return true
    }
}