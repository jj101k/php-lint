import Context from "../context"
import ContextTypes from "../context-types"
import Node from "./node"
export default class Label extends Node {
    /** @type {string} */
    get name() {
        return this.node.name
    }
    // No check required
}
