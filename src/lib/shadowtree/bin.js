import ConstRef from "./constref"
import Operation from "./operation"
import Expression from "./expression"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
import Variable from "./variable"
import * as PHPType from "../php-type"
import * as PHPError from "../php-error"
import BooleanState, { Assertion } from "../boolean-state";
export default class Bin extends Operation {
    /** @type {string} */
    get type() {
        return this.node.type
    }
    /** @type {Expression} */
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

        let left = this.left.check(context, new Set(), null)

        let boolean_state

        let right_context = context.childContext(false)
        right_context.importNamespaceFrom(context)
        let types = PHPType.Union.empty
        switch(this.type) {
            case "||":
            case "|":
            case "or":
                // Boolean (or)
                left.booleanState.falseStates.forEach(s => {
                    let c_right_context = right_context.childContext(false)
                    c_right_context.importNamespaceFrom(right_context)
                    c_right_context.importAssertions(s.assertions)
                    this.right.check(c_right_context, new Set(), null)
                    context.importNamespaceFrom(c_right_context)
                })
                types = types.addTypesFrom(PHPType.Core.types.bool)
                break
            case "&":
            case "&&":
            case "and":
                // Boolean (and)
                left.booleanState.trueStates.forEach(s => {
                    let c_right_context = right_context.childContext(false)
                    c_right_context.importNamespaceFrom(right_context)
                    c_right_context.importAssertions(s.assertions)
                    this.right.check(c_right_context, new Set(), null)
                    context.importNamespaceFrom(c_right_context)
                })
                types = types.addTypesFrom(PHPType.Core.types.bool)
                break
            case "*":
            case "/":
            case "-":
            case "%":
            case "**":
            case "<<":
            case ">>":
            case "^":
                // Numeric (1)
                this.right.check(right_context, new Set(), null)
                context.importNamespaceFrom(right_context)
                types = types.addTypesFrom(PHPType.Core.types.float)
                break
            case "+":
                // Numeric (2)
                this.right.check(right_context, new Set(), null)
                context.importNamespaceFrom(right_context)
                left.expressionType.types.forEach(type => {
                    if(type instanceof PHPType.Mixed) {
                        types = types.addTypesFrom(type.union)
                    } else {
                        switch(type.typeSignature) {
                            case "null":
                                // Yes null casts to number.
                            case "int":
                            case "float":
                                types = types.addTypesFrom(PHPType.Core.types.float)
                                break
                            case "array":
                                types = types.addTypesFrom(PHPType.Core.types.array)
                                break
                            default:
                                this.throw(
                                    new PHPError.BadTypeCast(`Possibly bad cast from type ${type} for +`),
                                    context,
                                    this.loc
                                )
                                types = types.addTypesFrom(PHPType.Core.types.float)
                        }
                    }
                })
                break
            case ".":
                // String
                this.right.check(right_context, new Set(), null)
                context.importNamespaceFrom(right_context)
                types = types.addTypesFrom(PHPType.Core.types.string)
                break
            case "~":
            case "!~":
            case "=":
            case "!=":
            case "?":
            case "<":
            case "<=":
            case ">":
            case "=>":
            case ">=":
            case "==":
            case "!==":
            case "===":
                // Comparison (boolean)
                this.right.check(right_context, new Set(), null)
                context.importNamespaceFrom(right_context)
                types = types.addTypesFrom(PHPType.Core.types.bool)
                break
            case "instanceof":
                // Comparison (boolean) (instanceof)
                this.right.check(right_context, new Set(), null)
                context.importNamespaceFrom(right_context)
                types = types.addTypesFrom(PHPType.Core.types.bool)
                if(
                    this.left instanceof Variable &&
                    this.right instanceof ConstRef
                ) {
                    boolean_state = new BooleanState().withType(
                        types,
                        new Assertion(
                            false,
                            '$' + this.left.name,
                            PHPType.Core.named(context.resolveNodeName(this.right))
                        )
                    )
                }
                break
            case "??":
                // Left (not null) or right
                types = types.addTypesFrom(
                    left.expressionType.excluding("null")
                ).addTypesFrom(
                    this.right.check(right_context, new Set(), null).expressionType
                )
                context.importNamespaceFrom(right_context)
                break
            default:
                console.log(this.node)
                console.log(`Don't know how to parse operator type ${this.type}`)
                this.right.check(right_context, new Set(), null)
                context.importNamespaceFrom(right_context)
                types = types.addTypesFrom(left.expressionType)
        }
        if(boolean_state) {
            return new ContextTypes(
                types,
                PHPType.Union.empty,
                boolean_state
            )
        } else {
            return new ContextTypes(types)
        }
    }
}
