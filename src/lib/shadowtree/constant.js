import Declaration from "./declaration"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
import {PHPTypeUnion, PHPSimpleType} from "../phptype"
import _Node from "./node"
export default class Constant extends Declaration {
    /** @type {?_Node} */
    get value() {
        return this.cacheNode("value")
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
        let types
        if(this.value) {
            types = this.value.check(context, new Set(), doc).expressionType
        } else {
            types = PHPSimpleType.coreTypes.mixed
        }
        context.classContext.addIdentifier(this.name, "public", true, types)
        return ContextTypes.empty
    }
}
