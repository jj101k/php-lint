import { Base } from "./base";
import { NodeTypes } from "../ast";
export class Class extends Base {
    protected node: NodeTypes.Class
    constructor(node: NodeTypes.Class) {
        super(node)
        this.node = node
    }
    check(): boolean {
        return true
    }
}