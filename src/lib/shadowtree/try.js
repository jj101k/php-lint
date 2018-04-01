import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import Block from "./block"
import Catch from "./catch"
import Doc from "./doc"
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
     * @param {parserStateOptions} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = {}, doc = null) {
        super.check(context, parser_state, doc)
        this.body.check(context, {}, null)
        this.catches.forEach(
            c => c.check(context, {}, null)
        )
        if(this.always) {
            this.always.check(context, {}, null)
        }
        return ContextTypes.empty // FIXME if union - special
    }
}
