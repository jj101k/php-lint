import {Context, ContextTypes} from "./node"
import Statement from "./statement"
export default class Declaration extends Statement {
    /** @type {string} */
    get name() {
        return this.node.name
    }
}
