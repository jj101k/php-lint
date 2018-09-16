import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode } from "./for-node";
import { Base } from "./base";
export class Echo extends Base {
    protected node: NodeTypes.Echo
    constructor(node: NodeTypes.Echo) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.arguments.forEach(
            n => forNode(n).check(context)
        )
        // this.node.shortForm
        return true
    }
}