import Context from "../context"
import ContextTypes from "../context-types"
import Lookup from "./lookup"
import {PHPFunctionType, PHPTypeUnion} from "../phptype"
import Variable from "./variable"
import StaticLookup from "./staticlookup"
import OffsetLookup from "./offsetlookup"
import Parenthesis from "./parenthesis"
import ConstRef from "./constref"
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
                    identifier_types.types.forEach(
                        itype => {
                            if(
                                itype instanceof PHPFunctionType &&
                                "" + itype.returnType == "self" &&
                                "" + type_union != "self"
                            ) {
                                let resolved_type = new PHPFunctionType(
                                    itype.argTypes,
                                    type_union,
                                    itype.passByReferencePositions,
                                    itype.callbackPositions
                                )
                                types_out.addType(resolved_type)
                            } else {
                                types_out.addType(itype)
                            }
                        }
                    )
                } else {
                    throw this.strictError(
                        `No accessible identifier ${class_context.name}->${offset}\n` +
                        `Accessible properties are: ${Object.keys(class_context.instanceIdentifiers).sort()}`,
                        context
                    )
                }
            })
        } catch(e) {
            this.handleException(e, context)
        }
        return new ContextTypes(types_out)
    }
}
