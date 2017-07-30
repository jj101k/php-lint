import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import Expression from "./expression"
export default class Clone extends Statement {
    /** @type {Expression} */
    get what() {
        return this.cacheNode("what")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        return this.what.check(context)
    }
}
