import Context from "../context"
import ContextTypes from "../context-types"
import Sys from "./sys"
import Doc from "./doc"
import {PHPSimpleType} from "../phptype"
export default class Isset extends Sys {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        super.check(context, in_call, doc)
        // no-op
        return new ContextTypes(PHPSimpleType.coreTypes.bool)
    }
}
