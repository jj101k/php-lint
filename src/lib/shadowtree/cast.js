import Operation from "./operation"
import Expression from "./expression"
import {Context, ContextTypes, Doc} from "./node"
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
     * @param {parserStateOptions} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = {}, doc = null) {
        super.check(context, parser_state, doc)
        this.what.check(context, {}, null)
        return new ContextTypes(PHPSimpleType.named(context.resolveName(this.type)))
    }
}
