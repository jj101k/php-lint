import Context from "../context"
import ContextTypes from "../context-types"
import Operation from "./operation"
import Variable from "./variable"
import Doc from "./doc"
export default class Post extends Operation {
    /** @type {string} */
    get type() {
        return this.node.type
    }
    /** @type {Variable} */
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
        return this.what.check(context) // FIXME coerce
    }
}
