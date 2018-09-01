import { Base } from "./base";
import { NodeTypes } from "../ast";
import { forNode } from "../considered";
export class Identifier extends Base {
    protected node: NodeTypes.Identifier
    constructor(node: NodeTypes.Identifier) {
        super(node)
        this.node = node
    }
    check(): boolean {
        // this.node.name
        // this.node.resolution
        return true
    }
}