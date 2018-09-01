import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class ClassConstant extends Base {
    protected node: NodeTypes.ClassConstant
    constructor(node: NodeTypes.ClassConstant) {
        super(node)
        this.node = node
    }
    check(): boolean {
        // this.node.isStatic
        // this.node.name
        if(this.node.value) {
            forNode(this.node.value).check()
        }
        // this.node.visibility
        return true
    }
}