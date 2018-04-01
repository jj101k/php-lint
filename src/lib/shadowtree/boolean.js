import Context from "../context"
import ContextTypes from "../context-types"
import Literal from "./literal"
import Doc from "./doc"
import {PHPSimpleType} from "../phptype"
export default class _Boolean extends Literal {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {parserStateOptions} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = {}, doc = null) {
        super.check(context, parser_state, doc)
        return new ContextTypes(PHPSimpleType.coreTypes.bool.withValue(this.value))
    }
}
