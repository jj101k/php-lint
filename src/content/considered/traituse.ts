import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class TraitUse extends Base {
    protected node: NodeTypes.TraitUse
    constructor(node: NodeTypes.TraitUse) {
        super(node)
        this.node = node
    }
    check(): boolean {
        if(this.node.adaptations) {
            this.node.adaptations.forEach(
                a => forNode(a).check()
            )
        }
        this.node.traits.forEach(
            t => forNode(t).check()
        )
        return true
    }
}