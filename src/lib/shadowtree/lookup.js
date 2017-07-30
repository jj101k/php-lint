import Context from "../context"
import ContextTypes from "../context-types"
import Expression from "./expression"
export default class Lookup extends Expression {
    /** @type {Expression} */
    get what() {
        return this.cacheNode("what")
    }
    /** @type {?Expression} */
    get offset() {
        return this.cacheNode("offset")
    }
}
