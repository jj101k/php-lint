import Operation from "./operation"
import Expression from "./expression"
import {Context, ContextTypes, Doc} from "./node"
export default class Parenthesis extends Operation {
    /** @type {Expression} */
    get inner() {
        return this.cacheNode("inner")
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
        return this.inner.check(context, {}, null)
    }
}
