import Context from "../context"
import ContextTypes from "../context-types"
import _Node from "./node"
import Identifier from "./identifier"
import Doc from "./doc"
export default class TraitUse extends _Node {
    /** @type {?_Node[]} */
    get adaptations() {
        return this.cacheNodeArray("adaptations")
    }
    /** @type {Identifier[]} */
    get traits() {
        return this.cacheNodeArray("traits")
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
        // TODO adaptations not yet supported
        if(this.traits) {
            this.traits.forEach(
                t => context.classContext.importTrait(
                    context.findClass(context.resolveNodeName(t))
                )
            )
        }
        return ContextTypes.empty
    }
}

