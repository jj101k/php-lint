import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { forNode, byKind } from "./for-node";
import { Base } from "./base";
class TraitUse extends Base {
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
byKind.traituse = TraitUse