import Declaration from "./declaration"
import {PHPTypeUnion} from "../phptype"
import Method from "./method"
import Identifier from "./identifier"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
export default class Interface extends Declaration {
    /** @type {?Identifier} */
    get extends() {
        let e = this.cacheNodeArray("extends")
        return e && e[0]
    }
    /** @type {Declaration[]} */
    get body() {
        return this.cacheNodeArray("body")
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
        let inner_context = context.childContext()
        inner_context.classContext = inner_context.globalContext.addInterface(
            context.resolveNodeName(this),
            this.extends ?
                context.findClass(context.resolveNodeName(this.extends)) :
                null,
            context.fileContext
        )
        this.body.forEach(
            b => {
                if(b instanceof Method) {
                    inner_context.classContext.addIdentifier(
                        b.name,
                        b.visibility,
                        b.isStatic,
                        PHPTypeUnion.mixedFunction
                    )
                }
            }
        )
        this.body.forEach(
            b => b.check(inner_context, new Set(), null)
        )
        return ContextTypes.empty
    }
}
