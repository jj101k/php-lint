import { Base } from "./base";
import { NodeTypes } from "../ast";
export class Number extends Base {
    protected node: NodeTypes.Number
    constructor(node: NodeTypes.Number) {
        super(node)
        this.node = node
    }
    check(): boolean {
        return true
    }
}