import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode } from "./for-node";
import { Base } from "./base";
export class Isset extends Base {
    protected node: NodeTypes.Isset
    constructor(node: NodeTypes.Isset) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.arguments.forEach(
            n => forNode(n).check(context)
        )
        return true
    }
}