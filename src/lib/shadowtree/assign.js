import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import Expression from "./expression"
import PHPStrictError from "../phpstricterror"
export default class Assign extends Statement {
    /** @type {string} */
    get operator() {
        return this.node.operator;
    }
    /**
     * @type {Expression}
     */
    get left() {
        return this.cacheNode("left")
    }
    /** @type {Expression} */
    get right() {
        return this.cacheNode("right")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let left_context = context.childContext(true)
        left_context.assigningType = this.right.check(context).expressionType
        this.left.check(left_context)
        if(left_context.assigningType.isEmpty) {
            throw new PHPStrictError(
                `No value to assign`,
                context,
                this.node.loc
            )
        } else {
            return new ContextTypes(left_context.assigningType)
        }
    }
}