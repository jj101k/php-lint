import _Node from "./node"
import {PHPTypeUnion} from "../php-type"
import Expression from "./expression"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
export default class Return extends _Node {
    /** @type {?Expression} */
    get expr() {
        return this.cacheNode("expr")
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
        if(this.expr) {
            return new ContextTypes(
                PHPTypeUnion.empty,
                this.expr.check(context, new Set(), null).expressionType
            )
        } else {
            return new ContextTypes(
                PHPTypeUnion.empty,
                PHPTypeUnion.empty
            )
        }
    }
}
