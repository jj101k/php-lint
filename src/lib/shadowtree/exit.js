import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import Node from "./node"
export default class Exit extends Statement {
    /** @type {?Node} */
    get status() {
        return this.cacheNode("status")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        if(this.status) {
            this.status.check(context)
        }
        return ContextTypes.empty
    }
}
