import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import _Node from "./node"
import Doc from "./doc"
export default class Exit extends Statement {
    /** @type {?_Node} */
    get status() {
        return this.cacheNode("status")
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
        if(this.status) {
            this.status.check(context, false, null)
        }
        return ContextTypes.empty
    }
}
