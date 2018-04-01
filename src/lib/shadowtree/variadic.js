import Context from "../context"
import ContextTypes from "../context-types"
import Expression from "./expression"
import Doc from "./doc"
export default class Variadic extends Expression {
    /** @type {Array|Expression} */
    get what() {
        return this.cacheNode("what")
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
        this.what.check(context, {}, null) // FIXME
        return ContextTypes.empty
    }
}
