import { Base } from "./base";
import { NodeTypes } from "../ast";
import { Considered } from "../considered";
import { Context } from "../../context";
export class Isset extends Base {
    protected node: NodeTypes.Isset
    constructor(node: NodeTypes.Isset) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.arguments.forEach(
            n => Considered.forNode(n).check(context)
        )
        return true
    }
}