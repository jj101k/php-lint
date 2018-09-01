import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
import { Context } from "../../context";
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