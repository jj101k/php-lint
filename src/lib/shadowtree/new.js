import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import {PHPSimpleType, PHPTypeUnion} from "../phptype"
import Node from "./node"
import Identifier from "./identifier"
import Variable from "./variable"
import Class from "./class"
export default class New extends Statement {
    /** @type {Identifier|Variable|Class} */
    get what() {
        return this.cacheNode("what")
    }
    /** @type {Node[]} */
    get arguments() {
        return this.cacheNodeArray("arguments")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.arguments.forEach(
            arg => arg.check(context)
        )
        if(this.what instanceof Variable) {
            return new ContextTypes(PHPTypeUnion.mixed)
        } else {
            return new ContextTypes(PHPSimpleType.named(
                context.resolveNodeName(this.what)
            ))
        }
    }
}
