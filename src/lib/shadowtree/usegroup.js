import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import Identifier from "./identifier"
import UseItem from "./useitem"
import Doc from "./doc"
export default class UseGroup extends Statement {
    /** @type {?Identifier} */
    get name() { // FIXME
        return this.cacheNode("name")
    }
    /** @type {?string} */
    get type() { // FIXME
        return this.node.type
    }
    /** @type {UseItem[]} */
    get items() {
        return this.cacheNodeArray("items")
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
        this.items.forEach(
            item => item.check(context, false, null)
        )
        // More or less no-op
        return ContextTypes.empty
    }
}
