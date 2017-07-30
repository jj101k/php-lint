import Context from "../context"
import ContextTypes from "../context-types"
import Node from "./node"
export default class Entry extends Node {
    /** @type {?Node} */
    get key() {
        return this.cacheNode("key")
    }
    /** @type {Node} */
    get value() {
        return this.cacheNode("value")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        if(this.key) {
            this.key.check(context)
        }
        this.value.check(context)
        return ContextTypes.empty
    }
}
