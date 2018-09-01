import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class Class extends Base {
    protected node: NodeTypes.Class
    constructor(node: NodeTypes.Class) {
        super(node)
        this.node = node
    }
    check(): boolean {
        this.node.body.forEach(
            b => forNode(b).check()
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