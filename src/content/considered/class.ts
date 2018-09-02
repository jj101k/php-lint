import { Base } from "./base";
import { NodeTypes } from "../ast";
import { Considered } from "../considered";
import { Context } from "../../context";
export class Class extends Base {
    protected node: NodeTypes.Class
    constructor(node: NodeTypes.Class) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.body.forEach(
            b => Considered.forNode(b).check(context)
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