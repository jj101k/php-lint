import Statement from "./statement"
import * as PHPType from "../php-type"
import _Node from "./node"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
export default class Eval extends Statement {
    /** @type {_Node} */
    get source() {
        return this.cacheNode("source")
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
        this.source.check(context, new Set(), null)
        return new ContextTypes(PHPType.Core.types.mixed)
    }
}
