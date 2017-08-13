import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import Expression from "./expression"
import Doc from "./doc"
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
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        super.check(context, in_call, doc)
        this.init.forEach(
            n => n.check(context)
        )
        this.test.forEach(
            n => n.check(context)
        )
        this.increment.forEach(
            n => n.check(context)
        )
        if(this.body) {
            this.body.check(context)
        }
        return ContextTypes.empty
    }
}
