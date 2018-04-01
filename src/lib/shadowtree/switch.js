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
     * @param {parserStateOptions} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = {}, doc = null) {
        super.check(context, parser_state, doc)
        this.test.check(context, {}, null)
        let type = PHPTypeUnion.empty
        let child_contexts = []
        this.body.children.forEach(
            c => { // FIXME fallthrough
                let case_context = context.childContext(false)
                case_context.importNamespaceFrom(context)
                type = type.addTypesFrom(c.check(case_context, {}, null).returnType)
                child_contexts.push(case_context)
            }
        )
        child_contexts.forEach(case_context => context.importNamespaceFrom(case_context))

        return new ContextTypes(PHPTypeUnion.empty, type)
    }
}
