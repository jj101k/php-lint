import { Base } from "./base";
import { NodeTypes } from "../ast";
export class Include extends Base {
    protected node: NodeTypes.Include
    constructor(node: NodeTypes.Include) {
        super(node)
        this.node = node
    }
    check(): boolean {
        return true
    }
}