import {Context, ContextTypes} from "./node"
import _Node from "./node"
export default class Label extends _Node {
    /** @type {string} */
    get name() {
        return this.node.name
    }
    // No check required
}
