import Expression from "./expression"
import Entry from "./entry"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
import {PHPIndexedArray, PHPTypeCore, PHPTypeUnion} from "../php-type"
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
        /** @type {?PHPTypeUnion} */
        let types
        if(this.items) {
            types = PHPTypeUnion.empty
            this.items.forEach(
                item => {
                    let t = item.check(context, new Set(), null)
                    types = types.addTypesFrom(t.expressionType)
                }
            )
            if(this.items.length && !this.items.some(item => !!item.key)) {
                return new ContextTypes(new PHPIndexedArray(types).union)
            }
        }
        return new ContextTypes(PHPTypeCore.types.array)
    }
}
