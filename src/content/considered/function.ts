import { Base } from "./base";
import { NodeTypes } from "../ast";
export class Function extends Base {
    protected node: NodeTypes.Function
    constructor(node: NodeTypes.Function) {
        super(node)
        this.node = node
    }
    check(): boolean {
        return true
    }
}