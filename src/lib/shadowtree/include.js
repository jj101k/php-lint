import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import Expression from "./expression"
import _String from "./string"
import Bin from "./bin"
import Magic from "./magic"
import Doc from "./doc"
import {PHPSimpleType} from "../phptype"
export default class Include extends Statement {
    /** @type {Expression} */
    get target() {
        return this.cacheNode("target")
    }
    /** @type {boolean} */
    get once() {
        return this.node.once
    }
    /** @type {boolean} */
    get require() {
        return this.node.require
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
        this.target.check(context, false, null)
        if(this.target instanceof _String) {
            context.checkFile(this.target.value, this.require)
        } else if(
            this.target instanceof Bin &&
            this.target.left instanceof Magic &&
            this.target.left.value == "__DIR__" &&
            this.target.right instanceof _String
        ) {
            context.checkFile(context.fileContext.directory + this.target.right.value, this.require)
        }
        return new ContextTypes(PHPSimpleType.coreTypes.string)
    }
}
