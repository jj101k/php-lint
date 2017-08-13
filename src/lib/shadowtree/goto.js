import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import * as PHPError from "../php-error"
export default class Goto extends Statement {
    /** @type {string} */
    get label() {
        return this.node.label
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @throws
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        this.throw(new PHPError.Goto(), context)
        return super.check(context)
    }
}
