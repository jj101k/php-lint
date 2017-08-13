import Context from "../context"
import ContextTypes from "../context-types"
import Expression from "./expression"
import Doc from "./doc"
export default class Variadic extends Expression {
    /** @type {Array|Expression} */
    get what() {
        return this.cacheNode("what")
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
        this.what.check(context) // FIXME
        return ContextTypes.empty
    }
}
