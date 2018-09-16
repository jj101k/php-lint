import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode, byKind } from "./for-node";
import { Base } from "./base";
class Class extends Base {
    protected node: NodeTypes.Class
    constructor(node: NodeTypes.Class) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.body.forEach(
            b => forNode(b).check(context)
        )
        // this.node.extends
        // this.node.implements
        // this.node.isAbstract
        // this.node.isAnonymous
        // this.node.isFinal
        // this.node.name
        return true
    }
}
byKind.class = Class