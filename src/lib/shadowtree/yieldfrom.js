import {Context, ContextTypes} from "./node"
import Expression from "./expression"
export default class YieldFrom extends Expression {
    /** @type {Expression} */
    get value() {
        return this.cacheNode("value")
    }
}
