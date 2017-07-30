import Context from "../context"
import ContextTypes from "../context-types"
import _Node from "./node"
import {PHPTypeUnion} from "../phptype"
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
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        return new ContextTypes(context.findName(this.name) || PHPTypeUnion.mixed)
    }
}
