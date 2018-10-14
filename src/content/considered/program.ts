import { Context } from "../../context";
import { NodeTypes } from "../ast";
import { Base } from "./base";
import { byKind } from "./for-node";
class Program extends Base {
    protected node: NodeTypes.Program
    constructor(node: NodeTypes.Program) {
        super(node)
        this.node = node
    }
    check(context: Context): boolean {
        this.node.children.forEach(
            child => context.check(child)
        )
        return true
    }
}
byKind.program = Program