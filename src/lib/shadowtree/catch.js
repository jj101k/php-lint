import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import {PHPSimpleType, PHPTypeUnion} from "../phptype"
import Identifier from "./identifier"
import Variable from "./variable"
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
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let types = PHPTypeUnion.empty
        this.what.forEach(
            w => types = types.addTypesFrom(PHPSimpleType.named(context.resolveName(w.name)))
        )
        let inner_context = context.childContext(true)
        inner_context.assigningType = PHPSimpleType.coreTypes.mixed
        this.variable.check(inner_context)
        this.body.check(context)
        return ContextTypes.empty
    }
}
