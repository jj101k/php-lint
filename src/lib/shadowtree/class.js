import Context from "../context"
import ContextTypes from "../context-types"
import Declaration from "./declaration"
import {PHPSimpleType, PHPTypeUnion} from "../phptype"
import Method from "./method"
import Property from "./property"
import ClassConstant from "./classconstant"
import Identifier from "./identifier"
import TraitUse from "./traituse"
import Doc from "./doc"
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
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        super.check(context)
        if(!this.name.match(/^([0-9A-Z]+[0-9a-z]*)+$/)) {
            // This does allow names like UPSPowerState
            this.throw(new PHPError.PSR1.S3ClassCase(), context)
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
            context.fileContext
        )
        inner_context.setThis()
        this.body.forEach(
            b => {
                if(b instanceof Method) {
                    inner_context.classContext.addIdentifier(
                        b.name,
                        b.visibility,
                        b.isStatic,
                        PHPTypeUnion.mixedFunction
                    )
                } else if(b instanceof Property) {
                    inner_context.classContext.addIdentifier(
                        b.name,
                        b.visibility,
                        b.isStatic,
                        PHPSimpleType.coreTypes.mixed
                    )
                } else if(b instanceof ClassConstant) {
                    inner_context.classContext.addIdentifier(
                        b.name,
                        "public",
                        true,
                        PHPSimpleType.coreTypes.mixed
                    )
                } else if(b instanceof TraitUse) {
                    // Do nothing - loaded shortly
                }
            }
        )
        /** @type {?Doc} */
        let last_doc = null
        this.body.forEach(
            b => {
                if(b instanceof Doc) {
                    last_doc = b
                } else {
                    b.check(inner_context, false, last_doc)
                    last_doc = null
                }
            }
        )
        return ContextTypes.empty
    }
}
