import Context from "../context"
import ContextTypes from "../context-types"
import Literal from "./literal"
import Doc from "./doc"
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
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        super.check(context, in_call, doc)
        return new ContextTypes(PHPSimpleType.coreTypes.string)
    }
}
