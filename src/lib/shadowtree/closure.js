import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import {PHPFunctionType, PHPSimpleType, PHPTypeUnion} from "../phptype"
import Block from "./block"
import Identifier from "./identifier"
import Variable from "./variable"
import Parameter from "./parameter"
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
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        var inner_context = context.childContext()
        let arg_types = []
        this.arguments.forEach(
            node => {
                let type_union
                if(node.type) {
                    type_union = PHPSimpleType.named(
                        context.resolveNodeName(node.type)
                    )
                } else {
                    type_union = PHPTypeUnion.mixed
                }
                if(node.nullable) {
                    type_union = type_union.addTypesFrom(PHPSimpleType.types.null)
                }
                arg_types.push(inner_context.addName(
                    "$" + node.name,
                    type_union
                ))
            }
        )
        this.uses.forEach(
            t => inner_context.addName(
                '$' + t.name,
                t.byref ?
                    (context.findName('$' + t.name) || PHPTypeUnion.mixed) :
                    this.assertHasName(context, '$' + t.name)
            )
        )
        if(context.findName("$this")) {
            inner_context.addName("$this", context.findName("$this"))
        }
        let return_type
        if(this.body) {
            return_type = this.body.check(inner_context).returnType
        } else {
            return_type = PHPTypeUnion.mixed
        }
        let types = new PHPFunctionType(arg_types, return_type).union
        return new ContextTypes(types)
    }
}
