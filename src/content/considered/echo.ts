import { Base } from "./base";
import { NodeTypes } from "../ast";
import { Considered } from "../considered";
import { Context } from "../../context";
export class Echo extends Base {
    protected node: NodeTypes.Echo
    constructor(node: NodeTypes.Echo) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.arguments.forEach(
            n => Considered.forNode(n).check(context)
        )
        // this.node.shortForm
        return true
    }
}