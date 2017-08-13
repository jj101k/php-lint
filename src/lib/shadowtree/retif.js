import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import {PHPTypeUnion} from "../phptype"
import Expression from "./expression"
import Doc from "./doc"
export default class RetIf extends Statement {
    /** @type {Expression} */
    get test() {
        return this.cacheNode("test")
    }
    /** @type {Expression} */
    get trueExpr() {
        return this.cacheNode("trueExpr")
    }
    /** @type {Expression} */
    get falseExpr() {
        return this.cacheNode("falseExpr")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        super.check(context, in_call, doc)
        let test_type = this.test.check(context, false, null).expressionType
        let types = PHPTypeUnion.empty
        if(this.trueExpr) {
            types = types.addTypesFrom(this.trueExpr.check(context, false, null).expressionType)
        } else {
            types = types.addTypesFrom(test_type)
        }
        types = types.addTypesFrom(this.falseExpr.check(context, false, null).expressionType)
        return new ContextTypes(types)
    }
}
