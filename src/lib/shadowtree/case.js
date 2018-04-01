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
     * @param {parserStateOptions} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = {}, doc = null) {
        super.check(context, parser_state, doc)
        if(this.test) {
            this.test.check(context, {}, null)
        }
        if(this.body) {
            return this.body.check(context, {}, null)
        } else {
            return ContextTypes.empty
        }
    }
}
