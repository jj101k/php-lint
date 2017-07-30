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
import _String from "./_string"
export default class PropertyLookup extends Lookup {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {boolean} [in_call]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        if(
            (
                this.what instanceof Variable ||
                this.what instanceof PropertyLookup ||
                this.what instanceof StaticLookup ||
                this.what instanceof OffsetLookup ||
                this.what instanceof Parenthesis
             ) &&
            this.offset instanceof ConstRef
        ) {
            let inner_context = context.childContext(true)
            inner_context.assigningType = null
            let type_union = this.what.check(inner_context).expressionType
            let types_out = PHPTypeUnion.empty
            try {
                type_union.types.forEach(t => {
                    let class_context = context.findClass("" + t)
                    let identifier_types = class_context.findInstanceIdentifier(this.offset.name, context.classContext, in_call)
                    if(identifier_types) {
                        types_out = types_out.addTypesFrom(identifier_types)
                    } else {
                        throw new PHPStrictError(
                            `No accessible identifier ${t}->${this.offset.name}\n` +
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
        } else if(
            this.what instanceof Call &&
            this.offset instanceof ConstRef
        ) {
            let type_union = this.what.check(context).expressionType
            let types_in = PHPTypeUnion.empty
            type_union.types.forEach(t => {
                if(t instanceof PHPFunctionType) {
                    types_in = types_in.addTypesFrom(t.returnType)
                } else {
                    types_in = types_in.addTypesFrom(PHPTypeUnion.mixed)
                }
            })
            let types_out = PHPTypeUnion.empty
            try {
                types_in.types.forEach(t => {
                    let class_context = context.findClass("" + t)
                    let identifier_types = class_context.findInstanceIdentifier(this.offset.name, context.classContext, in_call)
                    if(identifier_types) {
                        types_out = types_out.addTypesFrom(identifier_types)
                    } else {
                        throw new PHPStrictError(
                            `No accessible identifier ${t}->${this.offset.name}\n` +
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
        } else if(
            this.what instanceof Call &&
            this.offset instanceof _String
        ) {
            let type_union = this.what.check(context).expressionType
            let types_in = PHPTypeUnion.empty
            type_union.types.forEach(t => {
                if(t instanceof PHPFunctionType) {
                    types_in = types_in.addTypesFrom(t.returnType)
                } else {
                    types_in = types_in.addTypesFrom(PHPTypeUnion.mixed)
                }
            })
            let types_out = PHPTypeUnion.empty
            try {
                types_in.types.forEach(t => {
                    let class_context = context.findClass("" + t)
                    let identifier_types = class_context.findInstanceIdentifier(this.offset.value, context.classContext, in_call)
                    if(identifier_types) {
                        types_out = types_out.addTypesFrom(identifier_types)
                    } else {
                        throw new PHPStrictError(
                            `No accessible identifier ${t}->${this.offset.value}\n` +
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
        } else if(this.offset instanceof Variable) {
            return new ContextTypes(PHPTypeUnion.mixed)
        } else {
            console.log(this.node)
            console.log("TODO don't know how to check this kind of lookup")
        }
        return new ContextTypes(PHPTypeUnion.mixed)
    }
}
