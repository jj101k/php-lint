import { Base } from "./base";
import { NodeTypes } from "../ast";
export class Namespace extends Base {
    protected node: NodeTypes.Namespace
    constructor(node: NodeTypes.Namespace) {
        super(node)
        this.node = node
    }
    check(): boolean {
        return true
    }
}