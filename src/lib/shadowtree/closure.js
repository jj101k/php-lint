import Statement from "./statement"
import * as PHPType from "../php-type"
import Block from "./block"
import Identifier from "./identifier"
import Variable from "./variable"
import Parameter from "./parameter"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
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
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        if(parser_state.has(ParserStateOption.InAssignment) && !doc) {
            this.throw(new PHPError.NoDocClosure(), context)
        }
        var inner_context = context.childContext()
        let arg_types = []
        let pass_by_reference_positions = {}
        this.arguments.forEach(
            (node, index) => {
                let type = node.check(
                    inner_context,
                    parser_state,
                    null
                ).expressionType
                if(type.isMixed) {
                    type = new PHPType.Mixed(null, null, `parameter#${index}`).union
                }
                arg_types.push(type)
                inner_context.setName(
                    "$" + node.name,
                    type
                )
                if(node.byref) {
                    pass_by_reference_positions[index] = true
                }
            }
        )
        this.uses.forEach(
            t => inner_context.addName(
                '$' + t.name,
                t.byref ?
                    (context.findName('$' + t.name) || new PHPType.Mixed(null, null, "use").union) :
                    this.assertHasName(context, '$' + t.name)
            )
        )
        if(context.findName("$this")) {
            inner_context.setName("$this", context.findName("$this"))
        }
        let signature_type =(
            this.type &&
            PHPType.Core.named(context.resolveName(this.type.name))
        )
        let return_type
        if(this.body) {
            return_type = this.body.check(
                inner_context,
                new Set(),
                null
            ).returnType
            if(signature_type && !return_type.compliesWith(signature_type, name => context.compliantNames(name))) {
                this.throw(new PHPError.ReturnTypeMismatch(
                    `Practical return type ${return_type} does not match signature ${signature_type}`
                ), context)
            }
        } else if(signature_type) {
            return_type = signature_type
        } else {
            return_type = new PHPType.Mixed(null, null, "closure").union
        }
        let function_type = new PHPType.Function(
            arg_types,
            return_type,
            pass_by_reference_positions
        )
        let types = function_type.union
        return new ContextTypes(types)
    }
}
