import Statement from "./statement"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
export default class UseItem extends Statement {
    /** @type {string} */
    get name() {
        return this.node.name
    }
    /** @type {?string} */
    get type() { // FIXME
        return this.node.type
    }
    /** @type {?string} */
    get alias() {
        return this.node.alias
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
        var local_alias = this.alias || this.name.replace(/.*\\/, "")
        context.fileContext.alias(this.name, local_alias)
        return ContextTypes.empty
    }
}
