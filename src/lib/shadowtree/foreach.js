import Statement from "./statement"
import Expression from "./expression"
import {Context, ContextTypes, Doc} from "./node"
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
     * @param {parserStateOptions} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = {}, doc = null) {
        super.check(context, parser_state, doc)
        this.source.check(context, {}, null)
        let assign_context = context.childContext(true)
        assign_context.assigningType = PHPSimpleType.coreTypes.mixed
        if(this.key) {
            this.key.check(assign_context, {}, null)
        }
        this.value.check(assign_context, {}, null)
        this.body.check(context, {}, null)
        return ContextTypes.empty
    }
}
