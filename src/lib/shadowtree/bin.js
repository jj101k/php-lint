import Context from "../context"
import ContextTypes from "../context-types"
import Operation from "./operation"
import Expression from "./expression"
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
        super.check(context)
        let left_types = this.left.check(context).expressionType
        let right_types = this.right.check(context).expressionType
        let types = PHPTypeUnion.empty
        switch(this.type) {
            case "||":
            case "|":
            case "&":
            case "&&":
            case "and":
            case "or":
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
                types = types.addTypesFrom(PHPSimpleType.coreTypes.float)
                break
            case "+":
                if(left_types.types.length == 1 && "" + left_types[0] == "array") {
                    types = types.addTypesFrom(left_types)
                } else {
                    types = types.addTypesFrom(PHPSimpleType.coreTypes.float)
                }
                break
            case ".":
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
                types = types.addTypesFrom(PHPSimpleType.coreTypes.bool)
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
