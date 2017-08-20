import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import Expression from "./expression"
import Block from "./block"
import Doc from "./doc"
import {PHPTypeUnion} from "../phptype"
export default class Switch extends Statement {
    /** @type {Expression} */
    get test() {
        return this.cacheNode("test")
    }
    /** @type {Block} */
    get body() {
        return this.cacheNode("body")
    }
    /** @type {boolean} */
    get shortForm() {
        return this.node.shortForm
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        super.check(context, in_call, doc)
        this.test.check(context, false, null)
        let type = PHPTypeUnion.empty
        let child_contexts = []
        this.body.children.forEach(
            c => { // FIXME fallthrough
                let case_context = context.childContext(false)
                case_context.importNamespaceFrom(context)
                type = type.addTypesFrom(c.check(case_context, false, null).returnType)
                child_contexts.push(case_context)
            }
        )
        child_contexts.forEach(case_context => context.importNamespaceFrom(case_context))

        return new ContextTypes(PHPTypeUnion.empty, type)
    }
}
