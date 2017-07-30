import Context from "../context"
import ContextTypes from "../context-types"
import Node from "./node"
import Identifier from "./identifier"
export default class TraitUse extends Node {
    /** @type {?Node[]} */
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
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
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

