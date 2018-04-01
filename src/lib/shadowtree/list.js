import Sys from "./sys"
import {Context, ContextTypes, Doc} from "./node"
import {PHPSimpleType} from "../phptype"
export default class List extends Sys {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {parserStateOptions} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = {}, doc = null) {
        super.check(context, parser_state, doc)
        if(context.assigningType) {
            this.arguments.forEach(
                arg => {
                    let inner_context = context.childContext(true)
                    inner_context.assigningType = PHPSimpleType.coreTypes.mixed
                    arg.check(inner_context, {}, null)
                }
            )
            return ContextTypes.empty
        } else {
            throw new Error("List found outside assignment - internal error?")
        }
    }
}
