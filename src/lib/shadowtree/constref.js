import Expression from "./expression"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
import * as PHPType from "../php-type"
import Identifier from "./identifier"
export default class ConstRef extends Expression {
    /** @type {string|Identifier} */
    get name() {
        return this.cacheOptionalNode("name")
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
        if(this.name instanceof Identifier) {
            switch(this.name.name) {
                case "array":
                case "null":
                    return new ContextTypes(PHPType.Core.named(this.name.name))
                default:
            }
            let constant_type = context.findName(this.name.name)
            if(constant_type) {
                return new ContextTypes(constant_type)
            }
            let constant_type_munged =
                context.findName(this.name.name.toUpperCase())
            if(constant_type_munged) {
                return new ContextTypes(constant_type_munged)
            }
        }
        let classContext
        try {
            classContext = context.findClass(context.resolveNodeName(this))
        } catch(e) {
            this.handleException(e, context)
        }
        if(classContext) {
            return new ContextTypes(PHPType.Core.named(classContext.name))
        } else {
            return new ContextTypes(new PHPType.Mixed(null, null, "constref").union)
        }
    }
}
