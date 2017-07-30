import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import {PHPTypeUnion} from "../phptype"
import Variable from "./variable"
import Assign from "./assign"
export default class Static extends Statement {
    /** @type {(Variable|Assign)[]} */
    get items() {
        return this.cacheNodeArray("items")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let inner_context = context.childContext(true)
        inner_context.assigningType = PHPTypeUnion.mixed
        this.items.forEach(
            i => i.check(inner_context)
        )
        return ContextTypes.empty
    }
}