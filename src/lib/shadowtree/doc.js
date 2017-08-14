import Context from "../context"
import ContextTypes from "../context-types"
import _Node from "./node"
const doc_parser = require("doc-parser")
const reader = new doc_parser()
export default class Doc extends _Node {
    /** @type {boolean} */
    get isDoc() {
        return this.node.isDoc
    }
    /** @type {string[]} */
    get lines() {
        return this.node.lines
    }
    /**
     * @type {Object[]}
     */
    get structure() {
        if(!this._structure) {
            this._structure = reader.parse(this.lines).body
        }
        return this._structure
    }
}
