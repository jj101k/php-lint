import { Base } from "./base";
import { NodeTypes } from "../ast";
export class New extends Base {
    protected node: NodeTypes.New
    constructor(node: NodeTypes.New) {
        super(node)
        this.node = node
    }
    check(): boolean {
        return true
    }
}