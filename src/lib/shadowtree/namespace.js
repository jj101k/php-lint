import Context from "../context"
import ContextTypes from "../context-types"
import Block from "./block"
export default class Namespace extends Block {
    /** @type {string} */
    get name() {
        return this.node.name
    }
    /** @type {Boolean} */
    get withBrackets() { // FIXME
        return this.node.withBrackets
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        context.fileContext.namespace = this.name
        super.check(context)
        return ContextTypes.empty
    }
}
