import Context from "../context"
import ContextTypes from "../context-types"
import Constant from "./constant"
import PHPStrictError from "../php-strict-error"
export default class ClassConstant extends Constant {
    /** @type {boolean} */
    get isStatic() {
        return this.node.isStatic
    }
    /** @type {string} */
    get visibility() {
        return this.node.visibility
    }

    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        if(!this.name.match(/^[0-9A-Z_]+$/)) {
            throw new PHPStrictError(
                `PSR-1 #4.1 class constant names must be CAPITALISED_WITH_UNDERSCORES`,
                context,
                this.loc
            )
        }
        return super.check(context, in_call)
    }
}
