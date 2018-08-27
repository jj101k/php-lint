import { Base } from "./base";
import { NodeTypes } from "../ast";
export class Echo extends Base {
    protected node: NodeTypes.Echo
    constructor(node: NodeTypes.Echo) {
        super(node)
        this.node = node
    }
    check(): boolean {
        return true
    }
}