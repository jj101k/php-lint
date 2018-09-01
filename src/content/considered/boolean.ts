import { Base } from "./base";
import { NodeTypes } from "../ast";
export class Boolean extends Base {
    protected node: NodeTypes.Boolean
    constructor(node: NodeTypes.Boolean) {
        super(node)
        this.node = node
    }
    check(): boolean {
        // this.node.raw
        // this.node.value
        return true
    }
}