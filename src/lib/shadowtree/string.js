import Literal from "./literal"
import {PHPTypeCore} from "../php-type"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
export default class _String extends Literal {
    /** @type {string} */
    get label() {
        return this.node.label
    }
    /** @type {string} */
    get value() {
        return this.node.value
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
        let types = PHPTypeCore.types.string.withValue(this.value)
        return new ContextTypes(types)
    }
}
