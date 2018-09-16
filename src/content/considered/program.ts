import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode } from "./for-node";
import { Base } from "./base";
export class Program extends Base {
    protected node: NodeTypes.Program
    constructor(node: NodeTypes.Program) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.children.forEach(
            child => forNode(child).check(context)
        )
        return true
    }
}