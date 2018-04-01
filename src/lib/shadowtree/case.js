import _Node from "./node"
import Expression from "./expression"
import Block from "./block"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
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
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        if(this.test) {
            this.test.check(context, new Set(), null)
        }
        if(this.body) {
            return this.body.check(context, new Set(), null)
        } else {
            return ContextTypes.empty
        }
    }
}
