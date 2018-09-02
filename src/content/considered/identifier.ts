import { Base } from "./base";
import { NodeTypes } from "../ast";
import { Considered } from "../considered";
import { Context } from "../../context";
export class Identifier extends Base {
    protected node: NodeTypes.Identifier
    constructor(node: NodeTypes.Identifier) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.name
        // this.node.resolution
        return true
    }
}