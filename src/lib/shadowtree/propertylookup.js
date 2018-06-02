import Lookup from "./lookup"
import * as PHPType from "../php-type"
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
        let type_union = this.what.check(
            inner_context,
            new Set(),
            null
        ).expressionType
        let offset
        if(this.offset instanceof ConstRef) {
            offset = this.offset.name
        } else if(this.offset instanceof _String) {
            offset = this.offset.value
        } else if(this.offset instanceof Variable) {
            return new ContextTypes(new PHPType.Mixed(null, null, "propertylookup#var-offset").union)
        } else {
            console.log(this.node)
            console.log("TODO don't know how to check this kind of lookup")
            return new ContextTypes(new PHPType.Mixed(null, null, "propertylookup#unknown-offset").union)
        }
        let types_out = PHPType.Union.empty
        if(type_union.isEmpty) {
            this.throw(new PHPError.NotClass(
                `Can't look up property "${offset}" on empty type`
            ), context)
            return new ContextTypes(new PHPType.Mixed(null, null, "propertylookup#empty-type").union)
        }
        let seen_bad_type = false
        try {
            type_union.types.forEach(t => {
                if(
                    (t instanceof PHPType.IndexedArray) ||
                    (t instanceof PHPType.AssociativeArray) ||
                    t === PHPType.Core.types.null.types[0]
                ) {
                    if(!seen_bad_type) {
                        this.throw(
                            new PHPError.MultitypeBadObject(
                                `One or more of ${type_union} cannot be used as an object`
                            ),
                            context
                        )
                        seen_bad_type = true
                    }
                } else {
                    let class_context
                    try {
                        class_context = context.findClass(t.typeSignature)
                    } catch(e) {
                        this.handleException(e, context)
                    }
                    if(class_context) {
                        let identifier_types = class_context.findIdentifier(
                            "instance",
                            offset,
                            context.classContext,
                            parser_state
                        )
                        if(identifier_types) {
                            identifier_types.types.forEach(
                                itype => {
                                    if(
                                        itype instanceof PHPType.Function &&
                                        itype.returnType.typeSignature == "self" &&
                                        type_union.typeSignature != "self"
                                    ) {
                                        let resolved_type = new PHPType.Function(
                                            itype.argTypes,
                                            type_union,
                                            itype.passByReferencePositions,
                                            itype.callbackPositions
                                        )
                                        types_out = types_out.addType(resolved_type)
                                    } else {
                                        types_out = types_out.addType(itype)
                                    }
                                }
                            )
                        } else {
                            let context_name = context.classContext && context.classContext.name || "non-class code"
                            this.throw(new PHPError.NoProperty(
                                `No accessible instance property ${class_context.name}->${offset} (from ${context_name})\n` +
                                `Accessible properties are: ${class_context.accessibleInstanceIdentifiers.sort()}`
                            ), context)
                            types_out = types_out.addTypesFrom(new PHPType.Mixed(null, null, "propertylookup#inaccessible").union)
                        }
                    } else {
                        let context_name = context.classContext && context.classContext.name || "non-class code"
                        this.throw(new PHPError.NoProperty(
                            `No accessible instance property ${t.typeSignature}->${offset} (from ${context_name})`
                        ), context)
                        types_out = types_out.addTypesFrom(new PHPType.Mixed(null, null, "propertylookup#inaccessible").union)
                    }
                }
            })
            if(types_out.isEmpty) {
                this.throw(new PHPError.NotClass(
                    `Can't look up property "${offset}" on ${type_union}`
                ), context)
                return new ContextTypes(new PHPType.Mixed(null, null, "propertylookup#empty").union)
            }
        } catch(e) {
            this.handleException(e, context)
            types_out = types_out.addTypesFrom(new PHPType.Mixed(null, null, "propertylookup#exception").union)
        }
        return new ContextTypes(types_out)
    }
}
