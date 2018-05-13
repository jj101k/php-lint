import Operation from "./operation"
import Expression from "./expression"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
import * as PHPType from "../php-type"
import * as PHPError from "../php-error"
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
        let left_context = context.childContext(false)
        left_context.importNamespaceFrom(context)
        let left = this.left.check(left_context, new Set(), null)
        let left_types = left.expressionType
        let right_context = context.childContext(false)
        right_context.importNamespaceFrom(context)
        let types = PHPType.Union.empty
        switch(this.type) {
            case "||":
            case "|":
            case "or":
                // Boolean (or)
                left.booleanState.falseStates.forEach(s => {
                    let right_context = context.childContext(false)
                    right_context.importNamespaceFrom(context)
                    right_context.importAssertions(s.assertions)
                    this.right.check(right_context, new Set(), null)
                })
                types = types.addTypesFrom(PHPType.Core.types.bool)
                break
            case "&":
            case "&&":
            case "and":
                // Boolean (and)
                left.booleanState.trueStates.forEach(s => {
                    let right_context = context.childContext(false)
                    right_context.importNamespaceFrom(context)
                    right_context.importAssertions(s.assertions)
                    this.right.check(right_context, new Set(), null)
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
                types = types.addTypesFrom(PHPType.Core.types.float)
                break
            case "+":
                // Numeric (2)
                this.right.check(right_context, new Set(), null)
                left_types.types.forEach(type => {
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
            case "instanceof":
                // Comparison (boolean)
                this.right.check(right_context, new Set(), null)
                types = types.addTypesFrom(PHPType.Core.types.bool)
                break
            case "??":
                // Left (not null) or right
                types = types.addTypesFrom(
                    left_types.excluding("null")
                ).addTypesFrom(
                    this.right.check(right_context, new Set(), null).expressionType
                )
                break
            default:
                console.log(this.node)
                console.log(`Don't know how to parse operator type ${this.type}`)
                types = types.addTypesFrom(left_types)
        }
        context.importNamespaceFrom(left_context)
        context.importNamespaceFrom(right_context)
        return new ContextTypes(types)
    }
}
