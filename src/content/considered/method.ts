import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class Method extends Base {
    protected node: NodeTypes.Method
    constructor(node: NodeTypes.Method) {
        super(node)
        this.node = node
    }
    check(): boolean {
        this.node.arguments.forEach(
            a => forNode(a).check()
        )
        if(this.node.body) {
            forNode(this.node.body).check()
        }
        // this.node.byref
        // this.node.nullable
        // this.node.isAbstract
        // this.node.isFinal
        // this.node.isStatic
        // this.node.visibility
        return true
    }
}