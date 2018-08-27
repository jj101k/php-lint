import { Base } from "./base";
import { NodeTypes } from "../ast";
export class Array extends Base {
    protected node: NodeTypes.Array
    constructor(node: NodeTypes.Array) {
        super(node)
        this.node = node
    }
    check(): boolean {
        return true
    }
}