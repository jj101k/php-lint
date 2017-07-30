import Context from "../context"
import ContextTypes from "../context-types"
import Declaration from "./declaration"
import {PHPTypeUnion} from "../phptype"
import Method from "./method"
import Identifier from "./identifier"
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
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let inner_context = context.childContext()
        inner_context.classContext = inner_context.globalContext.addInterface(
            context.resolveNodeName(this),
            this.extends ?
                context.findClass(context.resolveNodeName(this.extends)) :
                null
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
            b => b.check(inner_context)
        )
        return ContextTypes.empty
    }
}