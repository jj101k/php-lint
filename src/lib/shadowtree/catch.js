import Statement from "./statement"
import * as PHPType from "../php-type"
import Identifier from "./identifier"
import Variable from "./variable"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
export default class Catch extends Statement {
    /** @type {Identifier[]} */
    get what() {
        return this.cacheNodeArray("what")
    }
    /** @type {Variable} */
    get variable() {
        return this.cacheNode("variable")
    }
    /** @type {Statement} */
    get body() {
        return this.cacheNode("body")
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
        let types = PHPType.Union.empty
        this.what.forEach(
            w => types = types.addTypesFrom(PHPType.Core.named(context.resolveName(w.name)))
        )
        let inner_context = context.childContext(true)
        inner_context.assigningType = types
        this.variable.check(inner_context, new Set(), null)
        this.body.check(context, new Set(), null)
        return ContextTypes.empty
    }
}
