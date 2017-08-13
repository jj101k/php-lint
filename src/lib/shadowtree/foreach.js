import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import Expression from "./expression"
import Doc from "./doc"
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
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        super.check(context, in_call, doc)
        this.source.check(context, false, null)
        let assign_context = context.childContext(true)
        assign_context.assigningType = PHPSimpleType.coreTypes.mixed
        if(this.key) {
            this.key.check(assign_context, false, null)
        }
        this.value.check(assign_context, false, null)
        this.body.check(context, false, null)
        return ContextTypes.empty
    }
}
