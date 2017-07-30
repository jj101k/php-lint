import Context from "../context"
import ContextTypes from "../context-types"
import Block from "./block"
export default class Program extends Block {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        var inner_context = context.childContext();
        this.children.forEach(child => child.check(inner_context));
        return super.check(context);
    }
}
