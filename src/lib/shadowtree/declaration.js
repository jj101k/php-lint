import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
export default class Declaration extends Statement {
    /** @type {string} */
    get name() {
        return this.node.name
    }
}
