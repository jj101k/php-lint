import Context from "../context"
import ContextTypes from "../context-types"
import _Node from "./node"
import Expression from "./expression"
import Block from "./block"
import Doc from "./doc"
export default class Case extends _Node {
    /** @type {?Expression} */
    get test() {
        return this.cacheNode("test")
    }
    /** @type {?Block} */
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
        super.check(context)
        if(this.test) {
            this.test.check(context)
        }
        if(this.body) {
            return this.body.check(context)
        } else {
            return ContextTypes.empty
        }
    }
}
