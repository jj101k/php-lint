import _Node from "./node"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
export default class Entry extends _Node {
    /** @type {?_Node} */
    get key() {
        return this.cacheNode("key")
    }
    /** @type {_Node} */
    get value() {
        return this.cacheNode("value")
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
        if(this.key) {
            this.key.check(context, new Set(), null)
        }
        return this.value.check(context, new Set(), null)
    }
}
