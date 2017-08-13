import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import {PHPSimpleType, PHPTypeUnion} from "../phptype"
import Identifier from "./identifier"
import Variable from "./variable"
import Doc from "./doc"
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
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        super.check(context, in_call, doc)
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
