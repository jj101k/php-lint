import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode } from "./for-node";
import { Base } from "./base";
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
            forNode(this.node.value).check(context)
        }
        // this.node.visibility
        return true
    }
}