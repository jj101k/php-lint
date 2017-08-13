import Context from "../context"
import ContextTypes from "../context-types"
import Sys from "./sys"
import {PHPSimpleType} from "../phptype"
export default class List extends Sys {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        super.check(context)
        if(context.assigningType) {
            this.arguments.forEach(
                arg => {
                    let inner_context = context.childContext(true)
                    inner_context.assigningType = PHPSimpleType.coreTypes.mixed
                    arg.check(inner_context)
                }
            )
            return ContextTypes.empty
        } else {
            throw new Error("List found outside assignment - internal error?")
        }
    }
}
