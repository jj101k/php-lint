import Context from "../context"
import ContextTypes from "../context-types"
import _Node from "./node"
import Identifier from "./identifier"
export default class TraitPrecedence extends _Node {
    /** @type {?Identifier} */
    get trait() {
        return this.cacheNode("trait")
    }
    /** @type {string} */
    get method() {
        return this.node.method
    }
    /** @type {Identifier[]} */
    get instead() {
        return this.cacheNodeArray("instead")
    }
    // FIXME WTF
}
