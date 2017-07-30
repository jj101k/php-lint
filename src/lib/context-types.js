import {PHPTypeUnion} from "./phptype"
/**
 * The types applicable to this point in the code.
 */
export default class ContextTypes {
    /**
     * @type {ContextTypes} A completely empty value/return
     */
    static get empty() {
        return new ContextTypes(PHPTypeUnion.empty)
    }
    /**
     * Builds the object
     * @param {PHPTypeUnion} expression_type This is the type that you'd get on
     * assignment to this node.
     * @param {PHPTypeUnion} [return_type]  This is the type that you'd get in
     * code which calls the function which wraps this node. Only a handful of
     * node types should set this: blocks ({}, foreach, if, switch, while) and
     * the return statement itelf.
     */
    constructor(expression_type, return_type = PHPTypeUnion.empty) {
        this.expressionType = expression_type
        this.returnType = return_type
    }
}