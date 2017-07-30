import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import {PHPTypeUnion} from "../phptype"
import Node from "./node"
export default class Block extends Statement {
    /** @type {Node[]} */
    get children() {
        return this.cacheNodeArray("children");
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let types = PHPTypeUnion.empty
        this.children.forEach(node => {
            types = types.addTypesFrom(node.check(context).returnType)
        })
        return new ContextTypes(PHPTypeUnion.empty, types)
    }
}
