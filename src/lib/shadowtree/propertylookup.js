import Context from "../context"
import ContextTypes from "../context-types"
import Lookup from "./lookup"
import {PHPFunctionType, PHPTypeUnion} from "../phptype"
import Variable from "./variable"
import StaticLookup from "./staticlookup"
import OffsetLookup from "./offsetlookup"
import Parenthesis from "./parenthesis"
import ConstRef from "./constref"
import PHPStrictError from "../phpstricterror"
import Call from "./call"
import _String from "./string"
export default class PropertyLookup extends Lookup {
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
        let offset
        if(this.offset instanceof ConstRef) {
            offset = this.offset.name
        } else if(this.offset instanceof _String) {
            offset = this.offset.value
        } else if(this.offset instanceof Variable) {
            return new ContextTypes(PHPTypeUnion.mixed)
        } else {
            console.log(this.node)
            console.log("TODO don't know how to check this kind of lookup")
            return new ContextTypes(PHPTypeUnion.mixed)
        }
        let types_out = PHPTypeUnion.empty
        try {
            type_union.types.forEach(t => {
                let class_context = context.findClass("" + t)
                let identifier_types = class_context.findInstanceIdentifier(offset, context.classContext, in_call)
                if(identifier_types) {
                    types_out = types_out.addTypesFrom(identifier_types)
                } else {
                    throw new PHPStrictError(
                        `No accessible identifier ${t}->${offset}\n` +
                        `Accessible properties are: ${Object.keys(class_context.instanceIdentifiers)}`,
                        context,
                        this.loc
                    )
                }
            })
        } catch(e) {
            this.handleException(e, context)
        }
        return new ContextTypes(types_out)
    }
}
