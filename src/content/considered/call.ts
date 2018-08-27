import { Base } from "./base";
import { NodeTypes } from "../ast";
export class Call extends Base {
    protected node: NodeTypes.Call
    constructor(node: NodeTypes.Call) {
        super(node)
        this.node = node
    }
    check(): boolean {
        return true
    }
}