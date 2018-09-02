import { Base } from "./base";
import { Considered } from "../considered";
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
            child => Considered.forNode(child).check(context)
        )
        return true
    }
}