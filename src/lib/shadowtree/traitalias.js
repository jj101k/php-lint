import Context from "../context"
import ContextTypes from "../context-types"
import _Node from "./node"
import Identifier from "./identifier"
export default class TraitAlias extends _Node {
    /** @type {?Identifier} */
    get trait() {
        return this.cacheNode("trait")
    }
    /** @type {string} */
    get method() {
        return this.node.method
    }
    /** @type {?string} */
    get as() {
        return this.cacheNode("as")
    }
    /** @type {?string} */
    get visibility() {
        return this.cacheNode("visibility")
    }
    // FIXME import
}
