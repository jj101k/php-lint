import Statement from "./statement"
import Expression from "./expression"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
import * as PHPType from "../php-type"
export default class Foreach extends Statement {
    /** @type {Expression} */
    get source() {
        return this.cacheNode("source")
    }
    /** @type {?Expression} */
    get key() {
        return this.cacheNode("key")
    }
    /** @type {Expression} */
    get value() {
        return this.cacheNode("value")
    }
    /** @type {Statement} */
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
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        let source_type = this.source.check(context, new Set(), null).expressionType
        let assign_context = context.childContext(true)
        if(this.key) {
            assign_context.assigningType = PHPType.Core.types.string
            this.key.check(assign_context, new Set(), null)
        }
        let inner_types = PHPType.Union.empty
        source_type.types.forEach(t => {
            if(t instanceof PHPType.AssociativeArray) {
                inner_types = inner_types.addTypesFrom(t.memberType)
            } else if(t instanceof PHPType.IndexedArray) {
                inner_types = inner_types.addTypesFrom(t.memberType)
            } else {
                inner_types = inner_types.addType(new PHPType.Mixed())
            }
        })
        assign_context.assigningType = inner_types
        this.value.check(assign_context, new Set(), null)
        this.body.check(context, new Set(), null)
        return ContextTypes.empty
    }
}
