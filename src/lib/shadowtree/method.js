import _Function from "./function"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
import * as PHPError from "../php-error"
export default class Method extends _Function {
    /** @type {boolean} */
    get isAbstract() {
        return this.node.isAbstract
    }
    /** @type {boolean} */
    get isFinal() {
        return this.node.isFinal
    }
    /** @type {boolean} */
    get isStatic() {
        return this.node.isStatic
    }
    /** @type {"public" | "protected" | "private"} */
    get visibility() {
        return this.node.visibility
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        if(!this.name.match(/^_*[0-9a-z]+([0-9A-Z]+[0-9a-z]*)*$/)) {
            // This does allow names like getUPSPowerState
            this.throw(new PHPError.PSR1.S43MethodName(), context)
        }
        if(!doc) {
            this.throw(new PHPError.NoDoc(), context)
        }
        let method_type = super.check(context, parser_state, doc).expressionType
        context.classContext.addIdentifier(
            this.name,
            this.visibility,
            this.isStatic,
            true,
            method_type
        )

        return new ContextTypes(method_type)
    }
}
