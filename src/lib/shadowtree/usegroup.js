import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import Identifier from "./identifier"
import UseItem from "./useitem"
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
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.items.forEach(
            item => item.check(context)
        )
        // More or less no-op
        return ContextTypes.empty
    }
}
