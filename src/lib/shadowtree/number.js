import Context from "../context"
import ContextTypes from "../context-types"
import Literal from "./literal"
import Doc from "./doc"
import {PHPSimpleType} from "../phptype"
export default class _Number extends Literal {
    /** @type {number} */
    get value() {
        return this.cacheOptionalNode("value")
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
        let types
        if(
            this.value % 1 ||
            this.value > 2**63 - 1 ||
            this.value < -(2**63)
        ) {
            types = PHPSimpleType.coreTypes.float.withValue(this.value)
        } else {
            types = PHPSimpleType.coreTypes.int.withValue(this.value)
        }
        return new ContextTypes(types)
    }
}
