import Context from "../context"
import ContextTypes from "../context-types"
import Constant from "./constant"
import * as PHPError from "../php-error"
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
            this.throw(new PHPError.PSR1.S41ClassConstantName(), context)
        }
        return super.check(context, in_call)
    }
}
