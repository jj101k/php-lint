import { Base } from "./base";
import { NodeTypes } from "../ast";
import { Considered } from "../considered";
import { Context } from "../../context";
export class Entry extends Base {
    protected node: NodeTypes.Entry
    constructor(node: NodeTypes.Entry) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        if(this.node.key) {
            Considered.forNode(this.node.key).check(context)
        }
        Considered.forNode(this.node.value).check(context)
        return true
    }
}