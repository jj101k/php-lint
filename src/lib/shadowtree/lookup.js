import {Context, ContextTypes} from "./node"
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
