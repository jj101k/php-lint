import { Base } from "./base";
import { NodeTypes } from "../ast";
import { Considered } from "../considered";
import { Context } from "../../context";
export class Method extends Base {
    protected node: NodeTypes.Method
    constructor(node: NodeTypes.Method) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.arguments.forEach(
            a => Considered.forNode(a).check(context)
        )
        if(this.node.body) {
            Considered.forNode(this.node.body).check(context)
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