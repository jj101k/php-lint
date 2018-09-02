import { Base } from "./base";
import { NodeTypes } from "../ast";
import { Considered } from "../considered";
import { Context } from "../../context";
export class PropertyLookup extends Base {
    protected node: NodeTypes.PropertyLookup
    constructor(node: NodeTypes.PropertyLookup) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        Considered.forNode(this.node.what).check(context)
        Considered.forNode(this.node.offset).check(context)
        return true
    }
}