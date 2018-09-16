import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode, byKind } from "./for-node";
import { Base } from "./base";
class ClassConstant extends Base {
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
byKind.classconstant = ClassConstant