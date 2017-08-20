import Context from "../context"
import ContextTypes from "../context-types"
import Expression from "./expression"
import Doc from "./doc"
export default class Variable extends Expression {
    /** @type {boolean} */
    get byref() {
        return this.node.byref;
    }
    /** @type {string} */
    get name() {
        return this.cacheOptionalNode("name")
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
        if(context.assigningType) {
            //console.log(`$${this.name} = ${context.assigningType} (${context.assigningType.typeSignature})`)
            return new ContextTypes(context.setName(
                '$' + this.name,
                context.assigningType
            ))
        } else {
            let types = this.assertHasName(context, '$' + this.name)
            //console.log(`$${this.name} == ${types} (${types.typeSignature})`)
            return new ContextTypes(types)
        }
    }
}
