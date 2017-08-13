import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
export default class UseItem extends Statement {
    /** @type {string} */
    get name() {
        return this.node.name
    }
    /** @type {?string} */
    get type() { // FIXME
        return this.node.type
    }
    /** @type {?string} */
    get alias() {
        return this.node.alias
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        super.check(context)
        var local_alias = this.alias || this.name.replace(/.*\\/, "")
        context.fileContext.alias(this.name, local_alias)
        return ContextTypes.empty
    }
}
