import Declaration from "./declaration"
import * as PHPType from "../php-type"
import Method from "./method"
import Property from "./property"
import ClassConstant from "./classconstant"
import Identifier from "./identifier"
import TraitUse from "./traituse"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
import * as PHPError from "../php-error"
export default class Class extends Declaration {
    /**
     * @type {Declaration[]}
     */
    get body() {
        return this.cacheNodeArray("body")
    }
    /**
     * @type {?Identifier}
     */
    get extends() {
        return this.cacheNode("extends")
    }
    /**
     * @type {Identifier[]}
     */
    get implements() {
        return this.cacheNode("implements")
    }
    /**
     * @type {boolean}
     */
    get isAbstract() {
        return this.node.isAbstract
    }
    /**
     * @type {boolean}
     */
    get isAnonymous() {
        return this.node.isAnonymous
    }
    /**
     * @type {boolean}
     */
    get isFinal() {
        return this.node.isFinal
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
        if(!this.name.match(/^([0-9A-Z]+[0-9a-z]*)+$/)) {
            // This does allow names like UPSPowerState
            this.throw(new PHPError.PSR1.S3ClassCase(), context)
        }
        if(!doc) {
            this.throw(new PHPError.NoDoc(), context)
        }
        let inner_context = context.childContext()
        let extended_class
        if(this.extends) {
            let extended_class_name = context.resolveNodeName(this.extends)
            try {
                extended_class = context.findClass(extended_class_name)
            } catch(e) {
                this.handleException(e, context)
            }
        }
        inner_context.classContext = inner_context.globalContext.addClass(
            context.resolveNodeName(this),
            extended_class,
            context.fileContext,
            {node: this, context: inner_context}
        )
        inner_context.setThis()
        this.checkInner(inner_context, parser_state, doc)
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
                let doc = last_doc
                if(b instanceof Doc) {
                    last_doc = b
                } else if(b instanceof Method) {
                    context.classContext.addTemporaryIdentifier(
                        b.name,
                        b.visibility,
                        b.isStatic,
                        () => b.check(context, new Set(), doc).expressionType
                    )
                } else if(b instanceof Property) {
                    context.classContext.addTemporaryIdentifier(
                        b.name,
                        b.visibility,
                        b.isStatic,
                        () => b.check(context, new Set(), doc).expressionType
                    )
                } else if(b instanceof ClassConstant) {
                    context.classContext.addTemporaryIdentifier(
                        b.name,
                        "public",
                        true,
                        () => b.check(context, new Set(), doc).expressionType
                    )
                } else if(b instanceof TraitUse) {
                    // Do nothing - loaded shortly
                } else {
                    b.check(context, new Set(), last_doc)
                    last_doc = null
                }
            }
        )

        last_doc = null
        this.body.forEach(
            b => {
                if(b instanceof Doc) {
                    last_doc = b
                } else {
                    if(b instanceof TraitUse) {
                        b.check(context, new Set(), last_doc)
                    }
                    last_doc = null
                }
            }
        )
        Object.keys(context.classContext.temporaryIdentifiers).forEach(name => {
            let ti = context.classContext.temporaryIdentifiers[name]
            if(ti && !ti.compileStarted) {
                ti.compileStarted = true
                ti.compile()
                delete context.classContext.temporaryIdentifiers[name]
            }
        })
    }
}
