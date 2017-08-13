import Context from "../context"
import ContextTypes from "../context-types"
import Sys from "./sys"
export default class Echo extends Sys {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        super.check(context)
        this.arguments.forEach(child => {
            let types = child.check(context)
        })
        return ContextTypes.empty
    }
}
