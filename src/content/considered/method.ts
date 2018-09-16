import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode } from "./for-node";
import { Base } from "./base";
export class Method extends Base {
    protected node: NodeTypes.Method
    constructor(node: NodeTypes.Method) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.arguments.forEach(
            a => forNode(a).check(context)
        )
        if(this.node.body) {
            forNode(this.node.body).check(context)
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