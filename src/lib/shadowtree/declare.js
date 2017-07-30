import Context from "../context"
import ContextTypes from "../context-types"
import Block from "./block"
import Expression from "./expression"
export default class Declare extends Block {
    /** @type {Expression[]} */
    get what() {
        return this.cacheNodeArray("what")
    }
    /** @type {string} */
    get mode() {
        return this.node.mode
    }
}
