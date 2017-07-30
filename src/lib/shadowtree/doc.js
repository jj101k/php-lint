import Context from "../context"
import ContextTypes from "../context-types"
import Node from "./node"
export default class Doc extends Node {
    /** @type {boolean} */
    get isDoc() {
        return this.node.isDoc
    }
    /** @type {string[]} */
    get lines() {
        return this.node.lines
    }
}
