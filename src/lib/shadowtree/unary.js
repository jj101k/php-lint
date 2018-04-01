import Operation from "./operation"
import Expression from "./expression"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
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
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        if(this.type == "!") {
            let etype = this.what.check(context, new Set(), null).expressionType
            let rtype = PHPSimpleType.coreTypes.bool
            let coerced_values = etype.coercedValues("bool")
            if(coerced_values) {
                coerced_values.forEach(cv => rtype = rtype.withValue(!cv))
            }
            return new ContextTypes(rtype)
        } else {
            console.log(`TODO: Unary type ${this.type} not handled yet`)
            return this.what.check(context, new Set(), null)
        }
    }
}
