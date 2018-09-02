import { Base } from "./base";
import { NodeTypes } from "../ast";
import { Considered } from "../considered";
import { Context } from "../../context";
export class TraitUse extends Base {
    protected node: NodeTypes.TraitUse
    constructor(node: NodeTypes.TraitUse) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        if(this.node.adaptations) {
            this.node.adaptations.forEach(
                a => Considered.forNode(a).check(context)
            )
        }
        this.node.traits.forEach(
            t => Considered.forNode(t).check(context)
        )
        return true
    }
}