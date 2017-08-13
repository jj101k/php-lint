import Context from "../context"
import ContextTypes from "../context-types"
import _Node from "./node"
export default class Entry extends _Node {
    /** @type {?_Node} */
    get key() {
        return this.cacheNode("key")
    }
    /** @type {_Node} */
    get value() {
        return this.cacheNode("value")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        super.check(context)
        if(this.key) {
            this.key.check(context)
        }
        this.value.check(context)
        return ContextTypes.empty
    }
}
