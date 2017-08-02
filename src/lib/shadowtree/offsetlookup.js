import Context from "../context"
import ContextTypes from "../context-types"
import Lookup from "./lookup"
import {PHPFunctionType, PHPTypeUnion} from "../phptype"
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
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let inner_context = context.childContext(true)
        inner_context.assigningType = null
        let type_union = this.what.check(inner_context).expressionType
        if(this.offset instanceof Variable) {
            return new ContextTypes(PHPTypeUnion.mixed)
        } else {
            return new ContextTypes(PHPTypeUnion.mixed) // TODO improve
        }
    }
}
