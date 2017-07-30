import Context from "../context"
import ContextTypes from "../context-types"
import Operation from "./operation"
import Expression from "./expression"
export default class Parenthesis extends Operation {
    /** @type {Expression} */
    get inner() {
        return this.cacheNode("inner")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        return this.inner.check(context)
    }
}
