import Statement from "./statement"
import Identifier from "./identifier"
import UseItem from "./useitem"
import {Context, ContextTypes, Doc} from "./node"
export default class UseGroup extends Statement {
    /** @type {?Identifier} */
    get name() { // FIXME
        return this.cacheNode("name")
    }
    /** @type {?string} */
    get type() { // FIXME
        return this.node.type
    }
    /** @type {UseItem[]} */
    get items() {
        return this.cacheNodeArray("items")
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
        this.items.forEach(
            item => item.check(context, {}, null)
        )
        // More or less no-op
        return ContextTypes.empty
    }
}
