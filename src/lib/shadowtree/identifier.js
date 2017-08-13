import Context from "../context"
import ContextTypes from "../context-types"
import _Node from "./node"
import Doc from "./doc"
import {PHPSimpleType} from "../phptype"
export default class Identifier extends _Node {
    /** @type {string} */
    get name() {
        return this.node.name;
    }
    /**
     * @type {string} eg. "fqn"
     */
    get resolution() {
        return this.node.resolution;
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
        return new ContextTypes(context.findName(this.name) || PHPSimpleType.coreTypes.mixed)
    }
}
