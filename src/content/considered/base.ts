import * as Known from "../known"
import { NodeTypes } from "../ast";
import { Context } from "../../context";
export class Base extends Known.Base {
    protected node: NodeTypes.Node
    constructor(node: NodeTypes.Node) {
        super()
        this.node = node
    }
    check(context: Context): boolean {
        if(this.constructor === Base) {
            console.log(`No checking supported for unrecognised node type ${this.node.kind}`)
        } else {
            console.log(`No checking supported for ${this.node.kind}`)
        }
        return true
    }
}