import Context from "../context"
import ContextTypes from "../context-types"
import Sys from "./sys"
import {PHPTypeUnion} from "../phptype"
export default class List extends Sys {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        if(context.assigningType) {
            this.arguments.forEach(
                arg => {
                    let inner_context = context.childContext(true)
                    inner_context.assigningType = PHPTypeUnion.mixed
                    arg.check(inner_context)
                }
            )
            return ContextTypes.empty
        } else {
            throw new Error("List found outside assignment - internal error?")
        }
    }
}
