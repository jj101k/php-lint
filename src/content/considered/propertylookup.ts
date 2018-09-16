import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode } from "./for-node";
import { Base } from "./base";
export class PropertyLookup extends Base {
    protected node: NodeTypes.PropertyLookup
    constructor(node: NodeTypes.PropertyLookup) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        forNode(this.node.what).check(context)
        forNode(this.node.offset).check(context)
        return true
    }
}