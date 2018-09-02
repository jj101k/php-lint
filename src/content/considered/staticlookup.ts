import { Base } from "./base";
import { NodeTypes } from "../ast";
import { Considered } from "../considered";
import { Context } from "../../context";
export class StaticLookup extends Base {
    protected node: NodeTypes.StaticLookup
    constructor(node: NodeTypes.StaticLookup) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        Considered.forNode(this.node.what).check(context)
        Considered.forNode(this.node.offset).check(context)
        return true
    }
}