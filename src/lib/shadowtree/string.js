import Context from "../context"
import ContextTypes from "../context-types"
import Literal from "./literal"
import {PHPSimpleType} from "../phptype"
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
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let types = PHPSimpleType.coreTypes.string
        return new ContextTypes(types)
    }
}
