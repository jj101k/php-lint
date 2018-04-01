import {Context, ContextTypes} from "./node"
import Literal from "./literal"
export default class Nowdoc extends Literal {
    /** @type {string} */
    get label() {
        return this.node.label
    }
    // No check needed - just a string
}
