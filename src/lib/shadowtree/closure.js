import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import {PHPFunctionType, PHPSimpleType, PHPTypeUnion} from "../phptype"
import Block from "./block"
import Identifier from "./identifier"
import Variable from "./variable"
import Parameter from "./parameter"
import Doc from "./doc"
import * as PHPError from "../php-error"
export default class Closure extends Statement {
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
        return this.cacheNode("type")
    }
    /** @type {Variable[]} */
    get uses() {
        return this.cacheNodeArray("uses")
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
        this.uses.forEach(
            t => inner_context.addName(
                '$' + t.name,
                t.byref ?
                    (context.findName('$' + t.name) || PHPSimpleType.coreTypes.mixed) :
                    this.assertHasName(context, '$' + t.name)
            )
        )
        if(context.findName("$this")) {
            inner_context.setName("$this", context.findName("$this"))
        }
        let signature_type = this.type && PHPSimpleType.named(context.resolveName(this.type.name))
        let return_type
        if(this.body) {
            return_type = this.body.check(inner_context, false, null).returnType
            if(signature_type && return_type !== signature_type) {
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
        let types = function_type.union
        return new ContextTypes(types)
    }
}
