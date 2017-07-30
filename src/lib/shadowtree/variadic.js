import Context from "../context"
import ContextTypes from "../context-types"
import Expression from "./expression"
export default class Variadic extends Expression {
    /** @type {Array|Expression} */
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
        this.what.check(context) // FIXME
        return ContextTypes.empty
    }
}
