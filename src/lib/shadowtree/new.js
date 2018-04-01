import Statement from "./statement"
import {PHPSimpleType, PHPTypeUnion} from "../phptype"
import _Node from "./node"
import Identifier from "./identifier"
import Variable from "./variable"
import Class from "./class"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"

export default class New extends Statement {
    /** @type {Identifier|Variable|Class} */
    get what() {
        return this.cacheNode("what")
    }
    /** @type {_Node[]} */
    get arguments() {
        return this.cacheNodeArray("arguments")
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
        this.arguments.forEach(
            arg => arg.check(context, new Set(), null)
        )
        if(this.what instanceof Variable) {
            return new ContextTypes(PHPSimpleType.coreTypes.mixed)
        } else {
            return new ContextTypes(PHPSimpleType.named(
                context.resolveNodeName(this.what)
            ))
        }
    }
}
