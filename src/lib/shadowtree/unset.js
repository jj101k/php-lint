import Sys from "./sys"
import {Context, ContextTypes, Doc} from "./node"
export default class Unset extends Sys {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {parserStateOptions} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = {}, doc = null) {
        super.check(context, parser_state, doc)
        // More or less no-op
        return ContextTypes.empty
    }
}
