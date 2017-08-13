import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import Expression from "./expression"
import Variable from "./variable"
import Doc from "./doc"
import {PHPSimpleType} from "../phptype"
import * as PHPError from "../php-error"
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
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        super.check(context, in_call, doc)
        let left_context = context.childContext(true)
        left_context.assigningType = this.right.check(context).expressionType
        this.left.check(left_context)
        if(
            this.left instanceof Variable &&
            this.left.name.length == 1 &&
            !PHPSimpleType.coreTypes["" + left_context.assigningType]
        ) {
            this.throw(new PHPError.SingleCharacterVariable(
                `Use of 1-character name $${this.left.name} of non-trivial type ${left_context.assigningType}`
            ), context)
        }
        if(left_context.assigningType.isEmpty) {
            this.throw(new PHPError.AssignNoValue(), context)
            return new ContextTypes(PHPSimpleType.coreTypes.null)
        } else {
            return new ContextTypes(left_context.assigningType)
        }
    }
}
