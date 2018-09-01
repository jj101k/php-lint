import { Base } from "./base";
import { forNode } from "../considered";
import { NodeTypes } from "../ast";
import { Context } from "../../context";
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