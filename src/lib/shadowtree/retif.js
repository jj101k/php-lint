import Statement from "./statement"
import * as PHPType from "../php-type"
import Expression from "./expression"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
import BooleanState from "../boolean-state";
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
        let test = this.test.check(context, new Set(), null)
        let test_type = test.expressionType
        let types = PHPType.Union.empty
        if(this.trueExpr) {
            test.booleanState.trueStates.forEach(s => {
                let t_context = context.childContext(false)
                t_context.importNamespaceFrom(context)
                t_context.importAssertions(s.assertions)
                types = PHPType.Union.combine(types, this.trueExpr.check(t_context, new Set(), null).expressionType)
            })
        } else {
            test.booleanState.trueStates.forEach(s => {
                types = PHPType.Union.combine(types, s.value)
            })
        }
        test.booleanState.falseStates.forEach(s => {
            let t_context = context.childContext(false)
            t_context.importNamespaceFrom(context)
            t_context.importAssertions(s.assertions)
            types = PHPType.Union.combine(types, this.falseExpr.check(t_context, new Set(), null).expressionType)
        })
        return new ContextTypes(types)
    }
}
