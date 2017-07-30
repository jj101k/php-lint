import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import Node from "./node"
export default class Sys extends Statement {
    /** @type {Node[]} */
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
