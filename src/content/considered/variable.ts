import { NodeTypes } from "../ast";
import { Context } from "../../context";
import { Base } from "./base";
import { byKind } from "./for-node";
import { Known } from "../../type/known";
export class Variable extends Base {
    protected node: NodeTypes.Variable
    constructor(node: NodeTypes.Variable) {
        super(node)
        this.node = node
    }
    /**
     * The name of the variable, if static, eg. "$foo"
     */
    get name(): string | null {
        if(typeof this.node.name == "string") {
            return "$" + this.node.name
        } else {
            return null
        }
    }
    check(context: Context): boolean {
        // this.node.curly
        if(this.name) {
            if(context.assigning) {
                context.set(this.name, new Known())
            } else {
                if(this.node.byref && !context.has(this.name)) {
                    context.set(this.name, new Known())
                }
                context.assert(
                    context.has(this.name),
                    `Unassigned variable ${this.name}`
                )
            }
        }
        return true
    }
}
byKind.variable = Variable