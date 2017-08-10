import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import PHPStrictError from "../php-strict-error"
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
        throw new PHPStrictError(
            "Use of goto",
            context,
            this.loc
        )
    }
}
