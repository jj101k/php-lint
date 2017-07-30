import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import Block from "./block"
import Catch from "./catch"
export default class Try extends Statement {
    /** @type {Block} */
    get body() {
        return this.cacheNode("body")
    }
    /** @type {Catch[]} */
    get catches() {
        return this.cacheNodeArray("catches")
    }
    /** @type {?Block} */
    get always() {
        return this.cacheNode("always")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.body.check(context)
        this.catches.forEach(
            c => c.check(context)
        )
        if(this.always) {
            this.always.check(context)
        }
        return ContextTypes.empty // FIXME if union - special
    }
}
