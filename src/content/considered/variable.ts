import { Base } from "./base";
import { NodeTypes } from "../ast";
import { Context } from "../../context";
export class Variable extends Base {
    protected node: NodeTypes.Variable
    constructor(node: NodeTypes.Variable) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.byref
        // this.node.curly
        // this.node.name
        return true
    }
}