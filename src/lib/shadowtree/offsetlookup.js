import Context from "../context"
import ContextTypes from "../context-types"
import Lookup from "./lookup"
import {PHPFunctionType, PHPSimpleType} from "../phptype"
import Variable from "./variable"
import PropertyLookup from "./propertylookup"
import StaticLookup from "./staticlookup"
import Parenthesis from "./parenthesis"
import Call from "./call"
export default class OffsetLookup extends Lookup {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        super.check(context)
        let inner_context = context.childContext(true)
        inner_context.assigningType = null
        let type_union = this.what.check(inner_context).expressionType
        if(this.offset instanceof Variable) {
            return new ContextTypes(PHPSimpleType.coreTypes.mixed)
        } else {
            return new ContextTypes(PHPSimpleType.coreTypes.mixed) // TODO improve
        }
    }
}
