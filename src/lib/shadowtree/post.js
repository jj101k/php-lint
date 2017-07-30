import Context from "../context"
import ContextTypes from "../context-types"
import Operation from "./operation"
import Variable from "./variable"
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
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        return this.what.check(context) // FIXME coerce
    }
}
