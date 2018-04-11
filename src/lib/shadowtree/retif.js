import Statement from "./statement"
import {PHPTypeUnion} from "../php-type"
import Expression from "./expression"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
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
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        let test_type = this.test.check(context, new Set(), null).expressionType
        let types = PHPTypeUnion.empty
        if(this.trueExpr) {
            types = types.addTypesFrom(this.trueExpr.check(context, new Set(), null).expressionType)
        } else {
            types = types.addTypesFrom(test_type)
        }
        types = types.addTypesFrom(this.falseExpr.check(context, new Set(), null).expressionType)
        return new ContextTypes(types)
    }
}
