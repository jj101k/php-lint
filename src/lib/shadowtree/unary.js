import Context from "../context"
import ContextTypes from "../context-types"
import Operation from "./operation"
import Expression from "./expression"
import Doc from "./doc"
import {PHPSimpleType} from "../phptype"
export default class Unary extends Operation {
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
        if(this.type == "!") {
            let etype = this.what.check(context, false, null).expressionType
            let rtype = PHPSimpleType.coreTypes.bool
            let coerced_values = etype.coercedValues("bool")
            if(coerced_values) {
                coerced_values.forEach(cv => rtype = rtype.withValue(!cv))
            }
            return new ContextTypes(rtype)
        } else {
            console.log(`TODO: Unary type ${this.type} not handled yet`)
            return this.what.check(context, false, null)
        }
    }
}
