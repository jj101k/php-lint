import { Base } from "./base";
import { NodeTypes } from "../ast";
import { Considered } from "../considered";
import { Context } from "../../context";
export class Foreach extends Base {
    protected node: NodeTypes.Foreach
    constructor(node: NodeTypes.Foreach) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        Considered.forNode(this.node.body).check(context)
        if(this.node.key) {
            Considered.forNode(this.node.key).check(context)
        }
        // this.node.shortForm
        Considered.forNode(this.node.source).check(context)
        Considered.forNode(this.node.value).check(context)
        return true
    }
}