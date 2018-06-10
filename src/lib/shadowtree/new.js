import Statement from "./statement"
import * as PHPType from "../php-type"
import _Node from "./node"
import Identifier from "./identifier"
import Variable from "./variable"
import _Class from "./class"
import ConstRef from "./constref"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"

export default class New extends Statement {
    /** @type {Identifier|Variable|_Class|_Node} */
    get what() {
        return this.cacheNode("what")
    }
    /** @type {_Node[]} */
    get arguments() {
        return this.cacheNodeArray("arguments")
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
        this.arguments.forEach(
            arg => arg.check(context, new Set(), null)
        )
        if(this.what instanceof Variable) {
            return new ContextTypes(new PHPType.Mixed(null, null, "new").union)
        } else if(
            (this.what instanceof Identifier) ||
            (this.what instanceof _Class) ||
            (this.what instanceof ConstRef)
        ) {
            return new ContextTypes(PHPType.Core.named(
                context.resolveNodeName(this.what)
            ))
        } else {
            /** @type {string[]} */
            let values = this.what.check(
                context
            ).expressionType.coercedValues("string")
            if(values) {
                let type = PHPType.Union.empty
                values.forEach(
                    v => type = PHPType.Union.combine(type, PHPType.Core.named(v))
                )
                return new ContextTypes(type)
            } else {
                return new ContextTypes(new PHPType.Mixed(null, null, "new").union)
            }
        }
    }
}
