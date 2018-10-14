import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class TraitUse extends Base {
    protected node: NodeTypes.TraitUse
    constructor(node: NodeTypes.TraitUse) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        if(this.node.adaptations) {
            this.node.adaptations.forEach(
                a => context.check(a)
            )
        }
        this.node.traits.forEach(
            t => context.check(t)
        )
        return true
    }
}
byKind.traituse = TraitUse