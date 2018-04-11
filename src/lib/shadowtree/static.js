import Statement from "./statement"
import {PHPSimpleType} from "../php-type"
import Variable from "./variable"
import Assign from "./assign"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
export default class Static extends Statement {
    /** @type {(Variable|Assign)[]} */
    get items() {
        return this.cacheNodeArray("items")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        let inner_context = context.childContext(true)
        inner_context.assigningType = PHPSimpleType.coreTypes.mixed
        this.items.forEach(
            i => i.check(inner_context, new Set(), null)
        )
        return ContextTypes.empty
    }
}
