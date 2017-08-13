import Context from "../context"
import ContextTypes from "../context-types"
import Operation from "./operation"
import Expression from "./expression"
import Doc from "./doc"
export default class Parenthesis extends Operation {
    /** @type {Expression} */
    get inner() {
        return this.cacheNode("inner")
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
        return this.inner.check(context)
    }
}
