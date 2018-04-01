import Statement from "./statement"
import {PHPSimpleType} from "../phptype"
import _Node from "./node"
import {Context, ContextTypes, Doc} from "./node"
export default class Eval extends Statement {
    /** @type {_Node} */
    get source() {
        return this.cacheNode("source")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {parserStateOptions} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = {}, doc = null) {
        super.check(context, parser_state, doc)
        this.source.check(context, {}, null)
        return new ContextTypes(PHPSimpleType.coreTypes.mixed)
    }
}
