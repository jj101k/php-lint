import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
export default class Goto extends Statement {
    /** @type {string} */
    get label() {
        return this.node.label
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        throw this.strictError(
            "Use of goto",
            context
        )
    }
}
