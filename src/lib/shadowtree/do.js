import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import Expression from "./expression"
import Doc from "./doc"
export default class Do extends Statement {
    /** @type {Expression} */
    get test() {
        return this.cacheNode("test")
    }
    /** @type {Statement} */
    get body() {
        return this.cacheNode("body")
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
        this.body.check(context, false, null)
        this.test.check(context, false, null)
        return ContextTypes.empty
    }
}
