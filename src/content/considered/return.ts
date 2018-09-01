import { Base } from "./base";
import { NodeTypes } from "../ast";
export class Return extends Base {
    protected node: NodeTypes.Return
    constructor(node: NodeTypes.Return) {
        super(node)
        this.node = node
    }
    check(): boolean {
        // this.node.raw
        // this.node.value
        return true
    }
}