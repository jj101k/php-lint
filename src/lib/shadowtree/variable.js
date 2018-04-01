import Expression from "./expression"
import {Context, ContextTypes, Doc} from "./node"

const DEBUG = false
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
     * @param {parserStateOptions} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = {}, doc = null) {
        super.check(context, parser_state, doc)
        if(context.assigningType) {
            if(DEBUG) {
                console.log(`$${this.name} = ${context.assigningType} (${context.assigningType.typeSignature})`)
            }
            return new ContextTypes(context.setName(
                '$' + this.name,
                context.assigningType
            ))
        } else {
            let types = this.assertHasName(context, '$' + this.name)
            if(DEBUG) {
                console.log(`$${this.name} == ${types} (${types.typeSignature})`)
            }
            return new ContextTypes(types)
        }
    }
}
