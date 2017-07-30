import Context from "../context"
import ContextTypes from "../context-types"
import Expression from "./expression"
export default class Yield extends Expression {
    /** @type {?Expression} */
    get value() {
        return this.cacheNode("value")
    }
    /** @type {?Expression} */
    get key() {
        return this.cacheNode("key")
    }
    // FIXME
}
