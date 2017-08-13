import Context from "../context"
import ContextTypes from "../context-types"
import _Node from "./node"
import Doc from "./doc"
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
        super.check(context, in_call, doc)
        if(this.key) {
            this.key.check(context, false, null)
        }
        this.value.check(context, false, null)
        return ContextTypes.empty
    }
}
