import * as PHPType from "./php-type"
import BooleanState from "./boolean-state"
/**
 * The types applicable to this point in the code.
 */
export default class ContextTypes {
    /**
     * @type {ContextTypes} A completely empty value/return
     */
    static get empty() {
        return new ContextTypes(PHPType.Union.empty)
    }
    /**
     * Builds the object
     * @param {PHPType.Union} expression_type This is the type that you'd get on
     * assignment to this node.
     * @param {PHPType.Union} [return_type]  This is the type that you'd get in
     * code which calls the function which wraps this node. Only a handful of
     * node types should set this: blocks ({}, foreach, if, switch, while) and
     * the return statement itelf.
     * @param {BooleanState} [boolean_state]
     */
    constructor(
        expression_type,
        return_type = PHPType.Union.empty,
        boolean_state = null
    ) {
        this.expressionType = expression_type
        this.returnType = return_type
        this.booleanState = boolean_state || new BooleanState()
    }
}