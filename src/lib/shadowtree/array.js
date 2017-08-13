import Expression from "./expression"
import Entry from "./entry"
import Context from "../context"
import ContextTypes from "../context-types"
import Doc from "./doc"
import {PHPSimpleType} from "../phptype"
export default class _Array extends Expression {
     /** @type {Entry[]} */
     get items() {
         return this.cacheNodeArray("items")
     }
     /** @type {boolean} */
     get shortForm() {
         return this.node.shortForm
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
        if(this.items) {
            this.items.forEach(
                item => item.check(context, false, null)
            )
        }
        return new ContextTypes(PHPSimpleType.coreTypes.array)
    }
}
