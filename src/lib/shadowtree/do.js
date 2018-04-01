import Statement from "./statement"
import Expression from "./expression"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
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
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        this.body.check(context, new Set(), null)
        this.test.check(context, new Set(), null)
        return ContextTypes.empty
    }
}
