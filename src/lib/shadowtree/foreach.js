import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import Expression from "./expression"
import {PHPSimpleType} from "../phptype"
export default class Foreach extends Statement {
    /** @type {Expression} */
    get source() {
        return this.cacheNode("source")
    }
    /** @type {?Expression} */
    get key() {
        return this.cacheNode("key")
    }
    /** @type {Expression} */
    get value() {
        return this.cacheNode("value")
    }
    /** @type {Statement} */
    get body() {
        return this.cacheNode("body")
    }
    /** @type {boolean} */
    get shortForm() {
        return this.node.shortForm
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.source.check(context)
        let assign_context = context.childContext(true)
        assign_context.assigningType = PHPSimpleType.coreTypes.mixed
        if(this.key) {
            this.key.check(assign_context)
        }
        this.value.check(assign_context)
        this.body.check(context)
        return ContextTypes.empty
    }
}
