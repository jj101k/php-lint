import Context from "../context"
import ContextTypes from "../context-types"
import Sys from "./sys"
export default class Unset extends Sys {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        // More or less no-op
        return ContextTypes.empty
    }
}
