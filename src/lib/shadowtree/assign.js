import Statement from "./statement"
import Expression from "./expression"
import Variable from "./variable"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
import * as PHPType from "../php-type"
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
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        let left_context = context.childContext(true)
        left_context.assigningType =
            this.right.check(context, new Set([ParserStateOption.InAssignment]), doc).expressionType
        this.left.check(left_context, new Set(), doc)
        if(
            this.left instanceof Variable &&
            this.left.name.length == 1 &&
            !PHPType.Core.types[left_context.assigningType.typeSignature]
        ) {
            this.throw(new PHPError.SingleCharacterVariable(
                `Use of 1-character name $${this.left.name} of non-trivial type ${left_context.assigningType}`
            ), context)
        }
        if(left_context.assigningType.isEmpty) {
            this.throw(new PHPError.AssignNoValue(), context)
            return new ContextTypes(PHPType.Core.types.null)
        } else {
            return new ContextTypes(left_context.assigningType)
        }
    }
}
