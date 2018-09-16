import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode } from "./for-node";
import { Base } from "./base";
export class TraitUse extends Base {
    protected node: NodeTypes.TraitUse
    constructor(node: NodeTypes.TraitUse) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        if(this.node.adaptations) {
            this.node.adaptations.forEach(
                a => forNode(a).check(context)
            )
        }
        this.node.traits.forEach(
            t => forNode(t).check(context)
        )
        return true
    }
}