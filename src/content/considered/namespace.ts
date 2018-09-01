import { Base } from "./base";
import { NodeTypes } from "../ast";
import { Context } from "../../context";
export class Namespace extends Base {
    protected node: NodeTypes.Namespace
    constructor(node: NodeTypes.Namespace) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.name
        // this.node.withBrackets
        return true
    }
}