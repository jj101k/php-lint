import Declaration from "./declaration"
import {default as Doc, DocTypeNode} from "./doc"
import Parameter from "./parameter"
import Block from "./block"
import Identifier from "./identifier"
import {Context, ContextTypes, ParserStateOption} from "./node"
import * as PHPType from "../php-type"
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
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        if(!doc) {
            this.throw(new PHPError.NoDoc(), context)
        }
        let doc_function_type
        if(doc) {
            try {
                let doc_structure = doc.structure
                if(
                    doc_structure.some(c => !!c.kind.match(/^(var|param|return)$/))
                ) {
                    let structure_arg_types = []
                    let structure_arg_names = []
                    let structure_return = null
                    doc_structure.forEach(c => c.resolve({
                        param: c => {
                            let param_type = c.typeStructure
                            this.resolveAllDocNames(
                                param_type,
                                context,
                                doc
                            )
                            structure_arg_types.push(param_type)
                            structure_arg_names.push(c.what.name)
                        },
                        return: c => {
                            let return_type = c.typeStructure
                            this.resolveAllDocNames(
                                return_type,
                                context,
                                doc
                            )
                            structure_return = return_type
                        }
                    }))
                    doc_function_type =
                        new PHPType.Function(structure_arg_types, structure_return)
                }
            } catch(e) {
                this.throw(
                    new PHPError.BadDoc(`Doc parse failure: ${e.message}`),
                    context,
                    doc.loc
                )
            }
        }
        var inner_context = context.childContext()

        let arg_types = []
        let pass_by_reference_positions = {}
        this.arguments.forEach(
            (node, index) => {
                arg_types.push(node.check(
                    inner_context,
                    parser_state,
                    null
                ).expressionType)
                if(node.byref) {
                    pass_by_reference_positions[index] = true
                }
            }
        )
        if(context.findName("$this")) {
            inner_context.setThis(context.ns["$this"])
        }

        let signature_type
        if(this.type) {
            signature_type = PHPType.Core.named(
                context.resolveName(this.type.name, this.type.resolution)
            )
            if(this.nullable) {
                signature_type = signature_type.addTypesFrom(
                    PHPType.Core.types.null
                )
            }
        }
        let return_type
        if(this.body) {
            return_type = this.body.check(
                inner_context,
                new Set(),
                null
            ).returnType
            if(signature_type && !return_type.compliesWith(signature_type)) {
                this.throw(new PHPError.ReturnTypeMismatch(
                    `Practical return type ${return_type} does not match signature ${signature_type}`
                ), context)
            }
        } else if(signature_type) {
            return_type = signature_type
        } else {
            return_type = PHPType.Core.types.mixed
        }
        let function_type = new PHPType.Function(
            arg_types,
            return_type,
            pass_by_reference_positions
        )
        if(
            doc_function_type &&
            !function_type.compliesWith(doc_function_type)
        ) {
            this.throw(
                new PHPError.BadDoc(
                    `Practical type ${function_type} does not comply with documented type ${doc_function_type} for ${this.name}`
                ),
                context
            )
        }
        if(context.classContext && context.classContext.name == "\\Slim\\App") {
            switch(this.name) {
                case "group":
                    function_type.callbackPositions[1] =
                        PHPType.Core.named("\\Slim\\App")
                    break
                default:
            }
        }
        let types = function_type.returnType.isMixed ?
            (doc_function_type || function_type).union :
            function_type.union
        if(this.constructor === _Function) {
            context.addName(this.name, types)
        }
        return new ContextTypes(types) // Special case
    }
}
