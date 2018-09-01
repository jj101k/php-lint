import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class Parenthesis extends Base {
    protected node: NodeTypes.Parenthesis
    constructor(node: NodeTypes.Parenthesis) {
        super(node)
        this.node = node
    }
    check(): boolean {
        forNode(this.node.inner).check()
        return true
    }
}