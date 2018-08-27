import { Base } from "./base";
import { NodeTypes } from "../ast";
export class If extends Base {
    protected node: NodeTypes.If
    constructor(node: NodeTypes.If) {
        super(node)
        this.node = node
    }
    check(): boolean {
        return true
    }
}