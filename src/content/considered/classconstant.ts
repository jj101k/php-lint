import { Base } from "./base";
import { NodeTypes } from "../ast";
import { Considered } from "../considered";
import { Context } from "../../context";
export class ClassConstant extends Base {
    protected node: NodeTypes.ClassConstant
    constructor(node: NodeTypes.ClassConstant) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.isStatic
        // this.node.name
        if(this.node.value) {
            Considered.forNode(this.node.value).check(context)
        }
        // this.node.visibility
        return true
    }
}