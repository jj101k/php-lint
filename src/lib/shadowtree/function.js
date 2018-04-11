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
            let doc_structure = doc.structure
            if(doc_structure.some(c => !!c.kind.match(/^(var|param|return)$/))) {
                let structure_arg_types = []
                let structure_arg_names = []
                let structure_return = null
                doc_structure.forEach(
                    c => {
                        /**
                         * @param {string} t
                         * @returns {string}
                         */
                        let resolve_name = t => {
                            try {
                                if(t.match(/^[A-Z0-9]/)) {
                                    return (
                                        context.fileContext.resolveAliasName(t) ||
                                        "\\" + t
                                    )
                                } else if(PHPType.Core.types.hasOwnProperty(t)) {
                                    return context.resolveName(PHPType.Core.types[t].toString())
                                } else {
                                    return context.resolveName(t, "uqn")
                                }
                            } catch(e) {
                                if(e instanceof PHPType.WrongType) {
                                    this.throw(new PHPError.BadCoreType(e.message), context, doc.loc)
                                    return context.resolveName(e.realName)
                                } else {
                                    throw e
                                }
                            }
                        }
                        /**
                         *
                         * @param {PHPType.Union} u
                         */
                        let resolve_all_names = u => {
                            let types = u.types
                            for(let i = 0; i < types.length; i++) {
                                let m = types[i]
                                if(m instanceof PHPType.Array) {
                                    types = types.concat(m.type.types)
                                } else if(m instanceof PHPType.IndexedArray) {
                                    types = types.concat(m.type.types)
                                } else if(m instanceof PHPType.Simple) {
                                    m.typeName = resolve_name(m.typeName)
                                } else if(m instanceof PHPType.Function) {
                                    m.argTypes.forEach(atype => types = types.concat(atype.types))
                                    types = types.concat(m.returnType.types)
                                } else {
                                    throw new Error(m.toString())
                                }
                            }
                        }
                        if(c instanceof DocTypeNode) {
                            switch(c.kind) {
                                case "param":
                                    let param_type = c.typeStructure
                                    resolve_all_names(param_type)
                                    structure_arg_types.push(param_type)
                                    structure_arg_names.push(c.name)
                                    break
                                case "return":
                                    let return_type = c.typeStructure
                                    resolve_all_names(return_type)
                                    structure_return = return_type
                                    break
                                default:
                                    console.log(`Skipping unrecognised PHPDoc tag @${c.kind}`)
                            }
                        } else {
                            switch(c.kind) {
                                case "api":
                                case "deprecated":
                                case "example":
                                case "internal":
                                case "link":
                                case "see":
                                case "throws":
                                    break
                                default:
                                    console.log(`Skipping unrecognised PHPDoc tag @${c.kind}`)
                            }
                        }
                    }
                )
                doc_function_type =
                    new PHPType.Function(structure_arg_types, structure_return)
            }
        }
        var inner_context = context.childContext()

        let arg_types = []
        let pass_by_reference_positions = {}
        this.arguments.forEach(
            (node, index) => {
                arg_types.push(node.check(inner_context, parser_state, null).expressionType)
                if(node.byref) {
                    pass_by_reference_positions[index] = true
                }
            }
        )
        if(context.findName("$this")) {
            inner_context.setThis()
        }

        let signature_type
        if(this.type) {
            signature_type = PHPType.Core.named(context.resolveName(this.type.name, this.type.resolution))
            if(this.nullable) {
                signature_type = signature_type.addTypesFrom(PHPType.Core.types.null)
            }
        }
        let return_type
        if(this.body) {
            return_type = this.body.check(inner_context, new Set(), null).returnType
            if(signature_type && !return_type.compatibleWith(signature_type)) {
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
            !function_type.compatibleWith(doc_function_type)
        ) {
            this.throw(
                new PHPError.BadDoc(
                    `Documented type ${doc_function_type} does not match actual ${function_type} for ${this.name}`
                ),
                context
            )
        }
        if(context.classContext && context.classContext.name == "\\Slim\\App") {
            switch(this.name) {
                case "group":
                    function_type.callbackPositions[1] = PHPType.Core.named("\\Slim\\App")
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
