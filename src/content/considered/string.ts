import { Base } from "./base";
import { NodeTypes } from "../ast";
export class String extends Base {
    protected node: NodeTypes.String
    constructor(node: NodeTypes.String) {
        super(node)
        this.node = node
    }
    check(): boolean {
        // this.node.raw
        // this.node.value
        return true
    }
}