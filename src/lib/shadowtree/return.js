import Context from "../context"
import ContextTypes from "../context-types"
import _Node from "./node"
import {PHPTypeUnion} from "../phptype"
import Expression from "./expression"
export default class Return extends _Node {
    /** @type {?Expression} */
    get expr() {
        return this.cacheNode("expr")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        if(this.expr) {
            return new ContextTypes(
                PHPTypeUnion.empty,
                this.expr.check(context).expressionType
            )
        } else {
            return new ContextTypes(
                PHPTypeUnion.empty,
                PHPTypeUnion.empty
            )
        }
    }
}
