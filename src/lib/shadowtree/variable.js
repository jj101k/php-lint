import Expression from "./expression"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"

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
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        if(context.assigningType) {
            if(DEBUG) {
                console.log(`$${this.name} = ${context.assigningType} (${context.assigningType})`)
            }
            return new ContextTypes(context.setName(
                '$' + this.name,
                context.assigningType
            ))
        } else {
            let types = this.assertHasName(context, '$' + this.name)
            if(DEBUG) {
                console.log(`$${this.name} == ${types} (${types})`)
            }
            return new ContextTypes(types)
        }
    }
}
