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
            let etype_single
            if(
                etype.types.length == 1 &&
                (etype_single = etype.types[0]) &&
                etype_single instanceof PHPSimpleType &&
                etype_single.values.length > 0
            ) {
                let possible_values = {}
                etype_single.values.forEach(
                    v => possible_values[+!v] = !v
                )
                if(Object.keys(possible_values).length == 1) {
                    return new ContextTypes(PHPSimpleType.coreTypes.bool.withValue(Object.values(possible_values)[0]))
                }
            }
            return new ContextTypes(PHPSimpleType.coreTypes.bool)
        } else {
            console.log(`TODO: Unary type ${this.type} not handled yet`)
            return this.what.check(context, false, null)
        }
    }
}
