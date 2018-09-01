import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class Isset extends Base {
    protected node: NodeTypes.Isset
    constructor(node: NodeTypes.Isset) {
        super(node)
        this.node = node
    }
    check(): boolean {
        this.node.arguments.forEach(
            n => forNode(n).check()
        )
        return true
    }
}