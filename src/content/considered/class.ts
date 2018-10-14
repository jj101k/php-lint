import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class Class extends Base {
    protected node: NodeTypes.Class
    constructor(node: NodeTypes.Class) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.body.forEach(
            b => context.check(b)
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