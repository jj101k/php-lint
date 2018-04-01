import {Context, ContextTypes} from "./node"
import Operation from "./operation"
import Expression from "./expression"
export default class Coalesce extends Operation {
    /** @type {Expression} */
    get test() {
        return this.cacheNode("test")
    }
    /** @type {Expression} */
    get ifnull() {
        return this.cacheNode("ifnull")
    }
}
