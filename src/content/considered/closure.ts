import { Base } from "./base";
import { NodeTypes } from "../ast";
export class Closure extends Base {
    protected node: NodeTypes.Closure
    constructor(node: NodeTypes.Closure) {
        super(node)
        this.node = node
    }
    check(): boolean {
        return true
    }
}