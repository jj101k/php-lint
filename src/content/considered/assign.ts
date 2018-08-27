import { Base } from "./base";
import { NodeTypes } from "../ast";
export class Assign extends Base {
    protected node: NodeTypes.Assign
    constructor(node: NodeTypes.Assign) {
        super(node)
        this.node = node
    }
    check(): boolean {
        return true
    }
}