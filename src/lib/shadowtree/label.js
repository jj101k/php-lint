import Context from "../context"
import ContextTypes from "../context-types"
import _Node from "./node"
export default class Label extends _Node {
    /** @type {string} */
    get name() {
        return this.node.name
    }
    // No check required
}
