import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode } from "./for-node";
import { Base } from "./base";
export class Parameter extends Base {
    protected node: NodeTypes.Parameter
    constructor(node: NodeTypes.Parameter) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.byref
        // this.node.name
        // this.node.nullable
        if(this.node.type) {
            forNode(this.node.type).check(context)
        }
        if(this.node.value) {
            forNode(this.node.value).check(context)
        }
        // this.node.variadic
        return true
    }
}