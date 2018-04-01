import Block from "./block"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
export default class Namespace extends Block {
    /** @type {string} */
    get name() {
        return this.node.name
    }
    /** @type {Boolean} */
    get withBrackets() { // FIXME
        return this.node.withBrackets
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        context.fileContext.namespace = this.name
        super.check(context, parser_state, doc)
        return ContextTypes.empty
    }
}
