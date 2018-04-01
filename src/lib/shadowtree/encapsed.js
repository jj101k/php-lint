import Literal from "./literal"
import {Context, ContextTypes, Doc} from "./node"
import {PHPSimpleType} from "../phptype"
export default class Encapsed extends Literal {
    /** @type {string} */
    get type() {
        return this.node.type
    }
    /** @type {?string} */
    get label() {
        return this.node.label
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
        return new ContextTypes(PHPSimpleType.coreTypes.string)
    }
}
