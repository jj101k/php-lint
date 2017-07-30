import Context from "../context"
import ContextTypes from "../context-types"
import Operation from "./operation"
import Expression from "./expression"
export default class Unary extends Operation {
    /** @type {string} */
    get type() {
        return this.node.type
    }
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
        return this.what.check(context) // FIXME infer from type
    }
}
