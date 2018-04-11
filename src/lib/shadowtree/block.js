import Statement from "./statement"
import {PHPTypeUnion} from "../php-type"
import _Node from "./node"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
export default class Block extends Statement {
    /** @type {_Node[]} */
    get children() {
        return this.cacheNodeArray("children");
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        let types = PHPTypeUnion.empty
        /** @type {?Doc} */
        let last_doc = null
        this.children.forEach(node => {
            if(node instanceof Doc) {
                last_doc = node
            } else {
                types = types.addTypesFrom(node.check(context, new Set(), last_doc).returnType)
                last_doc = null
            }
        })
        return new ContextTypes(PHPTypeUnion.empty, types)
    }
}
