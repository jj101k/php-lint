import _Node from "./node"
import * as PHPType from "../php-type"
import * as PHPError from "../php-error"
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
            let return_type = this.expr.check(context, new Set(), null).expressionType

            if(return_type.isEmpty) {
                this.throw(new PHPError.AssignNoValue(), context)
                return new ContextTypes(PHPType.Core.types.null)
            } else {
                return new ContextTypes(
                    PHPType.Union.empty,
                    return_type
                )
            }
        } else {
            return new ContextTypes(
                PHPType.Union.empty,
                PHPType.Union.empty
            )
        }
    }
}
