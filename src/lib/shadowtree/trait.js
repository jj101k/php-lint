import Context from "../context"
import ContextTypes from "../context-types"
import Declaration from "./declaration"
import {PHPSimpleType, PHPTypeUnion} from "../phptype"
import Identifier from "./identifier"
import Method from "./method"
export default class Trait extends Declaration {
    /** @type {?Identifier} */
    get extends() {
        return this.cacheNode("extends")
    }
    /** @type {Identifier[]} */
    get implements() {
        return this.cacheNodeArray("implements")
    }
    /** @type {Declaration[]} */
    get body() {
        return this.cacheNodeArray("body")
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
        let inner_context = context.childContext()
        inner_context.classContext = inner_context.globalContext.addTrait(
            context.resolveNodeName(this),
            this.extends ?
                context.findClass(context.resolveNodeName(this.extends)) :
                null,
            context.fileContext
        )
        inner_context.setThis()
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
