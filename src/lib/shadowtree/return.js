import Context from "../context"
import ContextTypes from "../context-types"
import _Node from "./node"
import {PHPTypeUnion} from "../phptype"
import Expression from "./expression"
import Doc from "./doc"
export default class Return extends _Node {
    /** @type {?Expression} */
    get expr() {
        return this.cacheNode("expr")
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
        if(this.expr) {
            return new ContextTypes(
                PHPTypeUnion.empty,
                this.expr.check(context, {}, null).expressionType
            )
        } else {
            return new ContextTypes(
                PHPTypeUnion.empty,
                PHPTypeUnion.empty
            )
        }
    }
}
