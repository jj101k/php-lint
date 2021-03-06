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
    /** @type {"public" | "protected" | "private"} */
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
                            property: c => {
                                this.throw(
                                    new PHPError.BadDoc(`@property used instead of @var`),
                                    context,
                                    doc.loc
                                )
                                doc_type = doc.resolveAllDocNames(
                                    c.typeStructure,
                                    context,
                                    doc
                                )
                            },
                            "var": c => {
                                doc_type = doc.resolveAllDocNames(
                                    c.typeStructure,
                                    context,
                                    doc
                                )
                            },
                        } :
                        {
                            property: c => {
                                doc_type = doc.resolveAllDocNames(
                                    c.typeStructure,
                                    context,
                                    doc
                                )
                            },
                            "var": c => {
                                this.throw(
                                    new PHPError.BadDoc(`@var used instead of @property`),
                                    context,
                                    doc.loc
                                )
                                doc_type = doc.resolveAllDocNames(
                                    doc_type,
                                    context,
                                    doc
                                )
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
            doc_type &&
            practical_type &&
            !practical_type.compliesWith(doc_type, name => context.compliantNames(name))
        ) {
            this.throw(
                new PHPError.BadDoc(
                    `Practical type ${practical_type} does not comply with documented type ${doc_type} for ${this.name}`
                ),
                context
            )
        }
        let types = (
            doc_type ||
            practical_type ||
            new PHPType.Mixed(context.classContext.name, this.name).union
        )
        context.classContext.addIdentifier(
            this.name,
            this.visibility,
            this.isStatic,
            false,
            types
        )
        return new ContextTypes(types)
    }
}
