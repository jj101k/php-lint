import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import {PHPTypeUnion} from "../phptype"
import Expression from "./expression"
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
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let test_type = this.test.check(context).expressionType
        let types = PHPTypeUnion.empty
        if(this.trueExpr) {
            types = types.addTypesFrom(this.trueExpr.check(context).expressionType)
        } else {
            types = types.addTypesFrom(test_type)
        }
        types = types.addTypesFrom(this.falseExpr.check(context).expressionType)
        return new ContextTypes(types)
    }
}
