import Context from "../context"
import ContextTypes from "../context-types"
import Literal from "./literal"
import {PHPSimpleType} from "../phptype"
import Doc from "./doc"
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
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        super.check(context, in_call, doc)
        let types = PHPSimpleType.coreTypes.string.withValue(this.value)
        return new ContextTypes(types)
    }
}
