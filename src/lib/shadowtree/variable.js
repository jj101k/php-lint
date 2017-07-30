import Context from "../context"
import ContextTypes from "../context-types"
import Expression from "./expression"
export default class Variable extends Expression {
    /** @type {boolean} */
    get byref() {
        return this.node.byref;
    }
    /** @type {string|_Node} */
    get name() {
        return this.cacheOptionalNode("name")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        if(context.assigningType) {
            return new ContextTypes(context.setName(
                '$' + this.name,
                context.assigningType
            ))
        } else {
            return new ContextTypes(this.assertHasName(context, '$' + this.name))
        }
    }
}