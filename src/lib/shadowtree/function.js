import Context from "../context"
import ContextTypes from "../context-types"
import Declaration from "./declaration"
import Parameter from "./parameter"
import Block from "./block"
import Identifier from "./identifier"
import Doc from "./doc"
import {PHPSimpleType, PHPFunctionType, PHPTypeUnion} from "../phptype"
import * as PHPError from "../php-error"
export default class _Function extends Declaration {
    /** @type {Parameter[]} */
    get arguments() {
        return this.cacheNodeArray("arguments")
    }
    /** @type {?Block} */
    get body() {
        return this.cacheNode("body")
    }
    /** @type {boolean} */
    get byref() {
        return this.node.byref
    }
    /** @type {boolean} */
    get nullable() {
        return this.node.nullable
    }
    /** @type {Identifier} */
    get type() {
        return this.node.type
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        super.check(context, in_call, doc)
        if(!doc) {
            this.throw(new PHPError.NoDoc(), context)
        }
        let structure_arg_types = []
        let structure_return = null
        doc.structure.forEach(
            c => {
                switch(c.kind) {
                    case "param":
                        let type = PHPTypeUnion.empty
                        c.type.name.split(/\|/).forEach(
                            t => {
                                type = type.addTypesFrom(PHPSimpleType.named(
                                    t.match(/^[A-Z0-9]/) ? "\\" + t : t
                                ))
                            }
                        )
                        structure_arg_types.push(type)
                        break
                    case "return":
                        let rtype = PHPTypeUnion.empty
                        c.what.name.split(/\|/).forEach(
                            t => {
                                rtype = rtype.addTypesFrom(PHPSimpleType.named(
                                    t.match(/^[A-Z0-9]/) ? "\\" + t : t
                                ))
                            }
                        )
                        structure_return = rtype
                        break
                    default:
                        console.log(`Skipping unknown doc type ${c.kind}`)
                }
            }
        )
        let doc_function_type = new PHPFunctionType(structure_arg_types, structure_return)
        var inner_context = context.childContext()

        let arg_types = []
        let pass_by_reference_positions = {}
        this.arguments.forEach(
            (node, index) => {
                arg_types.push(node.check(inner_context, in_call, null).expressionType)
                if(node.byref) {
                    pass_by_reference_positions[index] = true
                }
            }
        )
        if(context.findName("$this")) {
            inner_context.setThis()
        }

        let signature_type = this.type && PHPSimpleType.named(context.resolveName(this.type.name))
        let return_type
        if(this.body) {
            return_type = this.body.check(inner_context, false, null).returnType
            if(signature_type && !return_type.compatibleWith(signature_type)) {
                this.throw(new PHPError.ReturnTypeMismatch(
                    `Practical return type ${return_type} does not match signature ${signature_type}`
                ), context)
            }
        } else if(signature_type) {
            return_type = signature_type
        } else {
            return_type = PHPSimpleType.coreTypes.mixed
        }
        let function_type = new PHPFunctionType(
            arg_types,
            return_type,
            pass_by_reference_positions
        )
        if(!function_type.compatibleWith(doc_function_type)) {
            throw new PHPError.BadDoc(`Documented type ${doc_function_type} does not match actual ${function_type}`)
        }
        if(context.classContext && context.classContext.name == "\\Slim\\App") {
            switch(this.name) {
                case "group":
                    function_type.callbackPositions[1] = PHPSimpleType.named("\\Slim\\App")
                    break
                default:
            }
        }
        let types = function_type.union
        if(this.constructor === _Function) {
            context.addName(this.name, types)
        }
        return new ContextTypes(types) // Special case
    }
}
