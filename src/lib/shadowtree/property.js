import Declaration from "./declaration"
import {default as Doc, DocTypeNode} from "./doc"
import {Context, ContextTypes, ParserStateOption} from "./node"
import * as PHPType from "../php-type"
import * as PHPError from "../php-error"
import _Node from "./node"
export default class Property extends Declaration {
    /** @type {boolean} */
    get isFinal() {
        return this.node.isFinal
    }
    /** @type {boolean} */
    get isStatic() {
        return this.node.isStatic
    }
    /** @type {string} */
    get visibility() {
        return this.node.visibility
    }
    /** @type {?_Node} */
    get value() {
        return this.cacheNode("value")
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
        let doc_type
        if(doc) {
            try {
                let doc_structure = doc.structure
                if(doc_structure && doc_structure.length) {
                    let resolver = this.isStatic ?
                        {
                            "var": c => {
                                doc_type = c.typeStructure
                                this.resolveAllDocNames(doc_type, context, doc)
                            },
                        } :
                        {
                            property: c => {
                                doc_type = c.typeStructure
                                this.resolveAllDocNames(doc_type, context, doc)
                            },
                            "var": c => {
                                console.log("@var used instead of @property")
                                doc_type = c.typeStructure
                                this.resolveAllDocNames(doc_type, context, doc)
                            },
                        }
                    doc_structure.forEach(c => c.resolve(resolver))
                }
            } catch(e) {
                this.throw(
                    new PHPError.BadDoc(`Doc parse failure: ${e.message}`),
                    context,
                    doc.loc
                )
            }
        }
        let practical_type =
            this.value &&
            this.value.check(context, new Set(), null).expressionType
        if(
            practical_type &&
            !practical_type.compliesWith(doc_type)
        ) {
            this.throw(
                new PHPError.BadDoc(
                    `Practical type ${practical_type} does not comply with documented type ${doc_type} for ${this.name}`
                ),
                context
            )
        }
        context.classContext.addIdentifier(
            this.name,
            this.visibility,
            this.isStatic,
            practical_type || doc_type || PHPType.Core.types.mixed
        )
        return ContextTypes.empty
    }
}
