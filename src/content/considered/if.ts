import { Base } from "./base";
import { NodeTypes } from "../ast";
import { Considered } from "../considered";
import { Context } from "../../context";
export class If extends Base {
    protected node: NodeTypes.If
    constructor(node: NodeTypes.If) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        if(this.node.alternate) {
            Considered.forNode(this.node.alternate).check(context)
        }
        Considered.forNode(this.node.body).check(context)
        Considered.forNode(this.node.test).check(context)
        // this.node.shortForm
        return true
    }
}