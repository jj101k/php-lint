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
     * @param {parserStateOptions} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = {}, doc = null) {
        super.check(context, parser_state, doc)
        let types = PHPTypeUnion.empty
        /** @type {?Doc} */
        let last_doc = null
        this.children.forEach(node => {
            if(node instanceof Doc) {
                last_doc = node
            } else {
                types = types.addTypesFrom(node.check(context, {}, last_doc).returnType)
                last_doc = null
            }
        })
        return new ContextTypes(PHPTypeUnion.empty, types)
    }
}
