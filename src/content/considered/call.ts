import { Base } from "./base";
import { NodeTypes } from "../ast";
import { Considered } from "../considered";
import { Context } from "../../context";
export class Call extends Base {
    protected node: NodeTypes.Call
    constructor(node: NodeTypes.Call) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        if(this.node.what) {
            Considered.forNode(this.node.what).check(context)
        }
        this.node.arguments.forEach(
            a => Considered.forNode(a).check(context)
        )
        return true
    }
}