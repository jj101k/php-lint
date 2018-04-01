import Sys from "./sys"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
import {PHPSimpleType} from "../phptype"
export default class Isset extends Sys {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        // no-op
        return new ContextTypes(PHPSimpleType.coreTypes.bool)
    }
}
