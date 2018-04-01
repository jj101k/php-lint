import Statement from "./statement"
import {PHPTypeUnion} from "../phptype"
import Expression from "./expression"
import {Context, ContextTypes, Doc} from "./node"
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
     * @param {parserStateOptions} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = {}, doc = null) {
        super.check(context, parser_state, doc)
        let test_type = this.test.check(context, {}, null).expressionType
        let types = PHPTypeUnion.empty
        if(this.trueExpr) {
            types = types.addTypesFrom(this.trueExpr.check(context, {}, null).expressionType)
        } else {
            types = types.addTypesFrom(test_type)
        }
        types = types.addTypesFrom(this.falseExpr.check(context, {}, null).expressionType)
        return new ContextTypes(types)
    }
}
