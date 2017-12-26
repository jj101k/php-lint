import Context from "../context"
import ContextTypes from "../context-types"
import Operation from "./operation"
import Expression from "./expression"
import Doc from "./doc"
import {PHPSimpleType, PHPTypeUnion} from "../phptype"
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
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        super.check(context, in_call, doc)
        let left_types = this.left.check(context, false, null).expressionType
        let right_types = this.right.check(context, false, null).expressionType
        let types = PHPTypeUnion.empty
        switch(this.type) {
            case "||":
            case "|":
            case "&":
            case "&&":
            case "and":
            case "or":
                // Boolean
                types = types.addTypesFrom(PHPSimpleType.coreTypes.bool)
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
                types = types.addTypesFrom(PHPSimpleType.coreTypes.float)
                break
            case "+":
                // Numeric (2)
                if(left_types.types.length == 1 && "" + left_types[0] == "array") {
                    types = types.addTypesFrom(left_types)
                } else {
                    types = types.addTypesFrom(PHPSimpleType.coreTypes.float)
                }
                break
            case ".":
                // String
                types = types.addTypesFrom(PHPSimpleType.coreTypes.string)
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
                types = types.addTypesFrom(PHPSimpleType.coreTypes.bool)
                break
            case "??":
                // Left (not null) or right
                types = types.addTypesFrom(
                    left_types.excluding("null")
                ).addTypesFrom(right_types)
            default:
                console.log(this.node)
                console.log(`Don't know how to parse operator type ${this.type}`)
                types = types.addTypesFrom(left_types)
                types = types.addTypesFrom(right_types)
        }
        return new ContextTypes(types)
    }
}
