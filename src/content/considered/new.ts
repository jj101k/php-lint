import { Base } from "./base";
import { NodeTypes } from "../ast";
import { Considered } from "../considered";
import { Context } from "../../context";
export class New extends Base {
    protected node: NodeTypes.New
    constructor(node: NodeTypes.New) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        Considered.forNode(this.node.what).check(context)
        this.node.arguments.forEach(
            a => Considered.forNode(a).check(context)
        )
        return true
    }
}