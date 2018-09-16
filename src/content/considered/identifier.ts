import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { Base } from "./base";
import { byKind } from "./for-node";
class Identifier extends Base {
    protected node: NodeTypes.Identifier
    constructor(node: NodeTypes.Identifier) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        // this.node.name
        // this.node.resolution
        return true
    }
}
byKind.identifier = Identifier