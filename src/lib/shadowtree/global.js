import Statement from "./statement"
import * as PHPType from "../php-type"
import Variable from "./variable"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
export default class Global extends Statement {
    /** @type {Variable[]} */
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
        inner_context.assigningType = PHPType.Core.types.mixed
        this.items.forEach(item => item.check(inner_context, new Set(), null))
        return ContextTypes.empty
    }
}
