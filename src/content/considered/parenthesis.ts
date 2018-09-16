import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode } from "./for-node";
import { Base } from "./base";
export class Parenthesis extends Base {
    protected node: NodeTypes.Parenthesis
    constructor(node: NodeTypes.Parenthesis) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        forNode(this.node.inner).check(context)
        return true
    }
}