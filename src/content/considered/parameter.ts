import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class Parameter extends Base {
    protected node: NodeTypes.Parameter
    constructor(node: NodeTypes.Parameter) {
        super(node)
        this.node = node
    }
    check(): boolean {
        // this.node.byref
        // this.node.name
        // this.node.nullable
        if(this.node.type) {
            forNode(this.node.type).check()
        }
        if(this.node.value) {
            forNode(this.node.value).check()
        }
        // this.node.variadic
        return true
    }
}