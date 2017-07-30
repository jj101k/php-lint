import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
export default class Halt extends Statement {
    /** @type {string} */
    get after() {
        return this.node.after
    }
    // No check required - AST parser should have already halted here.
}
