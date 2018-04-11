import Lookup from "./lookup"
import {PHPFunctionType, PHPSimpleType} from "../php-type"
import Variable from "./variable"
import PropertyLookup from "./propertylookup"
import StaticLookup from "./staticlookup"
import Parenthesis from "./parenthesis"
import Call from "./call"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
export default class OffsetLookup extends Lookup {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        let inner_context = context.childContext(true)
        inner_context.assigningType = null
        let type_union = this.what.check(inner_context, new Set(), null).expressionType
        if(this.offset instanceof Variable) {
            return new ContextTypes(PHPSimpleType.coreTypes.mixed)
        } else {
            return new ContextTypes(PHPSimpleType.coreTypes.mixed) // TODO improve
        }
    }
}
