import Expression from "./expression"
import Statement from "./statement"
import * as PHPType from "../php-type"
import Block from "./block"
import Bin from "./bin"
import Variable from "./variable"
import ConstRef from "./constref"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
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
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        let test_state = this.test.check(context, new Set(), null).booleanState

        let body_context = context.childContext(false)
        body_context.importNamespaceFrom(context)
        test_state.trueStates.forEach(
            ts => body_context.importAssertions(ts.assertions)
        )
        if(
            this.test instanceof Bin &&
            this.test.type == "instanceof" &&
            this.test.left instanceof Variable &&
            this.test.right instanceof ConstRef
        ) {
            body_context.setName(
                '$' + this.test.left.name,
                PHPType.Core.named(context.resolveNodeName(this.test.right))
            )
        }
        let type = PHPType.Union.empty
        type = type.addTypesFrom(this.body.check(body_context, new Set(), null).returnType)
        if(this.alternate) {
            let alt_context = context.childContext(false)
            alt_context.importNamespaceFrom(context)
            test_state.falseStates.forEach(
                fs => alt_context.importAssertions(fs.assertions)
            )
            type = type.addTypesFrom(this.alternate.check(alt_context, new Set(), null).returnType)
            context.importNamespaceFrom(alt_context)
        }
        context.importNamespaceFrom(body_context)
        return new ContextTypes(PHPType.Union.empty, type)
    }
}
