import Statement from "./statement"
import Expression from "./expression"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
export default class For extends Statement {
    /** @type {Expression[]} */
    get init() {
        return this.cacheNodeArray("init")
    }
    /** @type {Expression[]} */
    get test() {
        return this.cacheNodeArray("test")
    }
    /** @type {Expression[]} */
    get increment() {
        return this.cacheNodeArray("increment")
    }
    /** @type {?Statement} */
    get body() {
        return this.cacheNode("body")
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
        this.init.forEach(
            n => n.check(context, new Set(), null)
        )
        this.test.forEach(
            n => n.check(context, new Set(), null)
        )
        this.increment.forEach(
            n => n.check(context, new Set(), null)
        )
        if(this.body) {
            this.body.check(context, new Set(), null)
        }
        return ContextTypes.empty
    }
}
