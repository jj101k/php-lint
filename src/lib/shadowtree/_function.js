import Context from "../context"
import ContextTypes from "../context-types"
import Declaration from "./declaration"
import Parameter from "./parameter"
import Block from "./block"
import {PHPSimpleType, PHPFunctionType, PHPTypeUnion} from "../phptype"
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
    /** @type {Array[]} */
    get type() {
        return this.node.type
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
        let pass_by_reference_positions = {}
        this.arguments.forEach(
            (node, index) => {
                let type_union
                if(node.type) {
                    type_union = PHPSimpleType.named(
                        context.resolveNodeName(node.type)
                    )
                } else {
                    type_union = PHPTypeUnion.mixed
                }
                if(node.nullable) {
                    type_union.addTypesFrom(PHPSimpleType.types.null)
                }
                arg_types.push(inner_context.addName(
                    "$" + node.name,
                    type_union
                ))
                if(node.byref) {
                    pass_by_reference_positions[index] = true
                }
            }
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
        let types = new PHPFunctionType(
            arg_types,
            return_type,
            pass_by_reference_positions
        ).union
        if(this.constructor === _Function) {
            context.addName(this.name, types)
        }
        return new ContextTypes(types) // Special case
    }
}
