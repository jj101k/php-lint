import Statement from "./statement"
import {PHPSimpleType, PHPTypeUnion} from "../phptype"
import Identifier from "./identifier"
import Variable from "./variable"
import {Context, ContextTypes, Doc} from "./node"
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
     * @param {parserStateOptions} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = {}, doc = null) {
        super.check(context, parser_state, doc)
        let types = PHPTypeUnion.empty
        this.what.forEach(
            w => types = types.addTypesFrom(PHPSimpleType.named(context.resolveName(w.name)))
        )
        let inner_context = context.childContext(true)
        inner_context.assigningType = PHPSimpleType.coreTypes.mixed
        this.variable.check(inner_context, {}, null)
        this.body.check(context, {}, null)
        return ContextTypes.empty
    }
}
