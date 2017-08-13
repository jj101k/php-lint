import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import {PHPSimpleType} from "../phptype"
import Variable from "./variable"
import Doc from "./doc"
export default class Global extends Statement {
    /** @type {Variable[]} */
    get items() {
        return this.cacheNodeArray("items")
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
        let inner_context = context.childContext(true)
        inner_context.assigningType = PHPSimpleType.coreTypes.mixed
        this.items.forEach(item => item.check(inner_context, false, null))
        return ContextTypes.empty
    }
}
