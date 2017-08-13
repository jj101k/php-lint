import Context from "../context"
import ContextTypes from "../context-types"
import Expression from "./expression"
import Statement from "./statement"
import {PHPTypeUnion, PHPSimpleType} from "../phptype"
import Block from "./block"
import Bin from "./bin"
import Variable from "./variable"
import ConstRef from "./constref"
export default class If extends Statement {
    /** @type {Expression} */
    get test() {
        return this.cacheNode("test")
    }
    /** @type {Block} */
    get body() {
        return this.cacheNode("body")
    }
    /** @type {Block|If|null} */
    get alternate() {
        return this.cacheNode("alternate")
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
        super.check(context)
        this.test.check(context)

        let body_context = context.childContext(false)
        body_context.importNamespaceFrom(context)
        if(
            this.test instanceof Bin &&
            this.test.type == "instanceof" &&
            this.test.left instanceof Variable &&
            this.test.right instanceof ConstRef
        ) {
            body_context.setName(
                '$' + this.test.left.name,
                PHPSimpleType.named(context.resolveNodeName(this.test.right))
            )
        }
        let type = PHPTypeUnion.empty
        type = type.addTypesFrom(this.body.check(body_context).returnType)
        if(this.alternate) {
            let alt_context = context.childContext(false)
            alt_context.importNamespaceFrom(context)
            type = type.addTypesFrom(this.alternate.check(alt_context).returnType)
            context.importNamespaceFrom(alt_context)
        }
        context.importNamespaceFrom(body_context)
        return new ContextTypes(PHPTypeUnion.empty, type)
    }
}
