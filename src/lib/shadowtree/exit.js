import Statement from "./statement"
import _Node from "./node"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
export default class Exit extends Statement {
    /** @type {?_Node} */
    get status() {
        return this.cacheNode("status")
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
        if(this.status) {
            this.status.check(context, new Set(), null)
        }
        return ContextTypes.empty
    }
}
