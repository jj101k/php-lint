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
        let left_types = this.left.check(context, new Set(), null).expressionType
        let right_types = this.right.check(context, new Set(), null).expressionType
        let types = PHPType.Union.empty
        switch(this.type) {
            case "||":
            case "|":
            case "or":
                // Boolean (or)
                types = types.addTypesFrom(PHPType.Core.types.bool)
                break
            case "&":
            case "&&":
            case "and":
                // Boolean (and)
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
                types = types.addTypesFrom(PHPType.Core.types.float)
                break
            case "+":
                // Numeric (2)
                left_types.types.forEach(type => {
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
                        case "mixed":
                            types = types.addTypesFrom(new PHPType.Mixed().union)
                            break
                        default:
                            this.throw(
                                new PHPError.BadTypeCast(`Possibly bad cast from type ${type} for +`),
                                context,
                                this.loc
                            )
                            types = types.addTypesFrom(PHPType.Core.types.float)
                    }
                })
                break
            case ".":
                // String
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
                types = types.addTypesFrom(PHPType.Core.types.bool)
                break
            case "??":
                // Left (not null) or right
                types = types.addTypesFrom(
                    left_types.excluding("null")
                ).addTypesFrom(right_types)
                break
            default:
                console.log(this.node)
                console.log(`Don't know how to parse operator type ${this.type}`)
                types = types.addTypesFrom(left_types)
                types = types.addTypesFrom(right_types)
        }
        return new ContextTypes(types)
    }
}
