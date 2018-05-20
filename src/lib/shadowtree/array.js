import Expression from "./expression"
import Entry from "./entry"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
import * as PHPType from "../php-type"
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
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        /** @type {?PHPType.Union} */
        let types
        if(this.items && this.items.length) {
            types = PHPType.Union.empty
            this.items.forEach(
                item => {
                    let t = item.check(context, new Set(), null)
                    types = types.addTypesFrom(t.expressionType)
                }
            )
            if(this.items.some(item => !!item.key)) {
                return new ContextTypes(new PHPType.AssociativeArray(types).union)
            } else {
                return new ContextTypes(new PHPType.IndexedArray(types).union)
            }
        } else {
            console.debug("Unable to determine array type in empty declaration")
            return new ContextTypes(PHPType.Core.types.array)
        }
    }
}
