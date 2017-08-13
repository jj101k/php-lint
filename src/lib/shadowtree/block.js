import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import {PHPTypeUnion} from "../phptype"
import _Node from "./node"
import Doc from "./doc"
export default class Block extends Statement {
    /** @type {_Node[]} */
    get children() {
        return this.cacheNodeArray("children");
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
        let types = PHPTypeUnion.empty
        this.children.forEach(node => {
            types = types.addTypesFrom(node.check(context).returnType)
        })
        return new ContextTypes(PHPTypeUnion.empty, types)
    }
}
