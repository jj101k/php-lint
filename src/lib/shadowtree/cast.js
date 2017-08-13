import Context from "../context"
import ContextTypes from "../context-types"
import Operation from "./operation"
import Expression from "./expression"
import Doc from "./doc"
import {PHPSimpleType} from "../phptype"
export default class Cast extends Operation {
    /** @type {string} */
    get type() {
        return this.node.type
    }
    /** @type {Expression} */
    get what() {
        return this.cacheNode("what")
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
        this.what.check(context, false, null)
        return new ContextTypes(PHPSimpleType.named(context.resolveName(this.type)))
    }
}
