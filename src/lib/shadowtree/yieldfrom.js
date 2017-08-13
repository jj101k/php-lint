import Context from "../context"
import ContextTypes from "../context-types"
import Expression from "./expression"
export default class YieldFrom extends Expression {
    /** @type {Expression} */
    get value() {
        return this.cacheNode("value")
    }
}
