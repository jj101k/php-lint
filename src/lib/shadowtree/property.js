import Declaration from "./declaration"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
import {PHPTypeCore} from "../php-type"
import _Node from "./node"
export default class Property extends Declaration {
    /** @type {boolean} */
    get isFinal() {
        return this.node.isFinal
    }
    /** @type {boolean} */
    get isStatic() {
        return this.node.isStatic
    }
    /** @type {string} */
    get visibility() {
        return this.node.visibility
    }
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
        context.classContext.addIdentifier(
            this.name,
            this.visibility,
            this.isStatic,
            this.value ? this.value.check(context, new Set(), null).expressionType : PHPTypeCore.types.mixed
        )
        return ContextTypes.empty
    }
}
