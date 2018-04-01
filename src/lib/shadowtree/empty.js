import Sys from "./sys"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
export default class Empty extends Sys {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        this.arguments.forEach(
            a => a.check(context, new Set(), null)
        )
        return ContextTypes.empty // FIXME?
    }
}
