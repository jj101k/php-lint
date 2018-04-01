import Context from "../context"
import ContextTypes from "../context-types"
import Constant from "./constant"
import Doc from "./doc"
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
     * @param {parserStateOptions} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = {}, doc = null) {
        if(!this.name.match(/^[0-9A-Z_]+$/)) {
            this.throw(new PHPError.PSR1.S41ClassConstantName(), context)
        }
        return super.check(context, parser_state, doc)
    }
}
