import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import {PHPSimpleType} from "../phptype"
import _Node from "./node"
export default class Eval extends Statement {
    /** @type {_Node} */
    get source() {
        return this.cacheNode("source")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.source.check(context)
        return new ContextTypes(PHPSimpleType.coreTypes.mixed)
    }
}
