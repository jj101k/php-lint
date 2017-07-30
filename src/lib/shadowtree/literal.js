import Context from "../context"
import ContextTypes from "../context-types"
import Expression from "./expression"
export default class Literal extends Expression {
    /** @type {_Node|string|number|boolean|null} */
    get value() {
        return this.cacheOptionalNode("value")
    }
}
