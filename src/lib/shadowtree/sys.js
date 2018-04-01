import {Context, ContextTypes} from "./node"
import Statement from "./statement"
import _Node from "./node"
export default class Sys extends Statement {
    /** @type {_Node[]} */
    get arguments() {
        if(
            this.node.arguments instanceof Array ||
            !this.node.arguments
        ) {
            return this.cacheNodeArray("arguments")
        } else {
            return [this.cacheNode("arguments")] // TODO
        }
    }
}
