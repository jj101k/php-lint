import Declaration from "./declaration"
import * as PHPType from "../php-type"
import Identifier from "./identifier"
import Method from "./method"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
export default class Trait extends Declaration {
    /** @type {?Identifier} */
    get extends() {
        return this.cacheNode("extends")
    }
    /** @type {Identifier[]} */
    get implements() {
        return this.cacheNodeArray("implements")
    }
    /** @type {Declaration[]} */
    get body() {
        return this.cacheNodeArray("body")
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
        context.globalContext.addTrait(
            context.resolveNodeName(this),
            this.extends ?
                context.findTrait(context.resolveNodeName(this.extends)) :
                null,
            context.fileContext,
            this
        )
        return ContextTypes.empty
    }

    /**
     * Checks that the syntax of the inner parts seem ok
     *
     * @param {Context} context
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {void}
     */
    checkInner(context, parser_state = new Set(), doc = null) {
        /** @type {?Doc} */
        let last_doc = null
        this.body.forEach(
            b => {
                if(b instanceof Doc) {
                    last_doc = b
                } else {
                    let doc = last_doc
                    last_doc = null
                    if(b instanceof Method) {
                        context.classContext.addTemporaryIdentifier(
                            b.name,
                            b.visibility,
                            b.isStatic,
                            () => b.check(context, new Set(), doc)
                        )
                    }
                }
            }
        )
        last_doc = null
        this.body.forEach(
            b => {
                if(b instanceof Doc) {
                    last_doc = b
                } else {
                    if(!(b instanceof Method)) {
                        b.check(context, new Set(), last_doc)
                    }
                    last_doc = null
                }
            }
        )
    }
}
