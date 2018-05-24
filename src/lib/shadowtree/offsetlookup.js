import Lookup from "./lookup"
import * as PHPType from "../php-type"
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
        let type_union = this.what.check(
            inner_context,
            new Set(),
            null
        ).expressionType
        let types_out = PHPType.Union.empty
        type_union.types.forEach(t => {
            if(t instanceof PHPType.AssociativeArray) {
                types_out = types_out.addTypesFrom(t.memberType).addTypesFrom(
                    PHPType.Core.types.null
                )
            } else if(t instanceof PHPType.IndexedArray) {
                types_out = types_out.addTypesFrom(t.memberType).addTypesFrom(
                    PHPType.Core.types.null
                )
            } else {
                types_out = types_out.addType(new PHPType.Mixed(null, null, "offsetlookup#not-array"))
            }
        })
        return new ContextTypes(types_out)
    }
}
