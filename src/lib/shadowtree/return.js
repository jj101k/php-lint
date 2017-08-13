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
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
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
