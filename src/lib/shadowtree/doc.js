import AbstractNode from "./abstract-node"
import {default as DocParser, DocNode} from "../doc-parser"

export default class Doc extends AbstractNode {
    /** @type {boolean} */
    get isDoc() {
        return this.node.isDoc
    }
    /** @type {string[]} */
    get lines() {
        return this.node.lines
    }
    /**
     * @type {DocNode[]}
     */
    get structure() {
        if(!this._structure) {
            this._structure = new DocParser(this.lines).top.children
        }
        return this._structure
    }
}
export {DocTypeNode} from "../doc-parser"