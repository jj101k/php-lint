import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import {PHPTypeUnion} from "../phptype"
import Node from "./node"
export default class Eval extends Statement {
    /** @type {Node} */
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
        return new ContextTypes(PHPTypeUnion.mixed)
    }
}
