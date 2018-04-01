import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import {PHPSimpleType} from "../phptype"
import Variable from "./variable"
import Assign from "./assign"
import Doc from "./doc"
export default class Static extends Statement {
    /** @type {(Variable|Assign)[]} */
    get items() {
        return this.cacheNodeArray("items")
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
        let inner_context = context.childContext(true)
        inner_context.assigningType = PHPSimpleType.coreTypes.mixed
        this.items.forEach(
            i => i.check(inner_context, {}, null)
        )
        return ContextTypes.empty
    }
}
