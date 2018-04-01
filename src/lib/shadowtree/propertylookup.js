import Lookup from "./lookup"
import {PHPFunctionType, PHPSimpleType, PHPTypeUnion} from "../phptype"
import Variable from "./variable"
import StaticLookup from "./staticlookup"
import OffsetLookup from "./offsetlookup"
import Parenthesis from "./parenthesis"
import ConstRef from "./constref"
import Call from "./call"
import _String from "./string"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
import * as PHPError from "../php-error"
export default class PropertyLookup extends Lookup {
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
        let offset
        if(this.offset instanceof ConstRef) {
            offset = this.offset.name
        } else if(this.offset instanceof _String) {
            offset = this.offset.value
        } else if(this.offset instanceof Variable) {
            return new ContextTypes(PHPSimpleType.coreTypes.mixed)
        } else {
            console.log(this.node)
            console.log("TODO don't know how to check this kind of lookup")
            return new ContextTypes(PHPSimpleType.coreTypes.mixed)
        }
        let types_out = PHPTypeUnion.empty
        try {
            type_union.types.forEach(t => {
                let class_context = context.findClass("" + t)
                if(class_context) {
                    let identifier_types = class_context.findInstanceIdentifier(offset, context.classContext, parser_state)
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
                        this.throw(new PHPError.NoProperty(
                            `No accessible identifier ${class_context.name}->${offset}\n` +
                            `Accessible properties are: ${Object.keys(class_context.instanceIdentifiers).sort()}`
                        ), context)
                    }
                }
            })
        } catch(e) {
            this.handleException(e, context)
        }
        return new ContextTypes(types_out)
    }
}
