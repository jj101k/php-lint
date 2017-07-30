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
        let types_in
        if(
            this.what instanceof Variable ||
            this.what instanceof PropertyLookup ||
            this.what instanceof StaticLookup ||
            this.what instanceof OffsetLookup ||
            this.what instanceof Parenthesis
        ) {
            let inner_context = context.childContext(true)
            inner_context.assigningType = null
            types_in = this.what.check(inner_context)
        } else if(
            this.what instanceof Call
        ) {
            let type_union = this.what.check(context).expressionType
            types_in = PHPTypeUnion.empty
            type_union.types.forEach(t => {
                if(t instanceof PHPFunctionType) {
                    types_in = types_in.addType(t.returnType)
                } else {
                    types_in = types_in.addTypesFrom(PHPTypeUnion.mixed)
                }
            })
        } else {
            console.log(this.node)
            console.log("TODO don't know how to check this kind of lookup")
            return new ContextTypes(PHPTypeUnion.mixed)
        }
        if(this.offset instanceof Variable) {
            return new ContextTypes(PHPTypeUnion.mixed)
        } else {
            return new ContextTypes(PHPTypeUnion.mixed) // TODO improve
        }
    }
}
