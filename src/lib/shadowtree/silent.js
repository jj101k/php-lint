import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import Expression from "./expression"
import Doc from "./doc"
export default class Silent extends Statement {
    /** @type {Expression} */
    get expr() {
        return this.cacheNode("expr")
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
        return this.expr.check(context)
    }
}
