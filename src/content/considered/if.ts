import { NodeTypes } from "../ast";
import { Considered } from "../considered";
import { Context } from "../../context";
import { forNode } from "./for-node";
import { Base } from "./base";
export class If extends Base {
    protected node: NodeTypes.If
    constructor(node: NodeTypes.If) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        if(this.node.alternate) {
            forNode(this.node.alternate).check(context)
        }
        forNode(this.node.body).check(context)
        forNode(this.node.test).check(context)
        // this.node.shortForm
        return true
    }
}