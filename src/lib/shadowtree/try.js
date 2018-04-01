import Statement from "./statement"
import Block from "./block"
import Catch from "./catch"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
export default class Try extends Statement {
    /** @type {Block} */
    get body() {
        return this.cacheNode("body")
    }
    /** @type {Catch[]} */
    get catches() {
        return this.cacheNodeArray("catches")
    }
    /** @type {?Block} */
    get always() {
        return this.cacheNode("always")
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
        this.catches.forEach(
            c => c.check(context, new Set(), null)
        )
        if(this.always) {
            this.always.check(context, new Set(), null)
        }
        return ContextTypes.empty // FIXME if union - special
    }
}
