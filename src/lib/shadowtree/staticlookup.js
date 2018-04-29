import Lookup from "./lookup"
import OffsetLookup from "./offsetlookup"
import * as PHPType from "../php-type"
import Identifier from "./identifier"
import Variable from "./variable"
import ConstRef from "./constref"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
import PHPStrictError from "../php-strict-error"
import * as PHPError from "../php-error"

/** @type {boolean} */
const WARN_UNDECLARED_STATIC = false

export default class StaticLookup extends Lookup {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        let class_context
        let resolved_name
        if(this.what instanceof Variable) {
            this.what.check(context, new Set(), null)
            // $x::$y
            //this.offset.check(context)
            return new ContextTypes(new PHPType.Mixed().union)
        } else if(
            this.what instanceof Identifier ||
            this.what instanceof ConstRef
        ) {
            try {
                resolved_name = context.resolveNodeName(this.what)
            } catch(e) {
                this.handleException(e, context)
            }
            try {
                class_context = context.findClass(resolved_name)
            } catch(e) {
                this.handleException(e, context)
            }
        }
        if(this.offset instanceof ConstRef) {
            if(class_context) {
                let types
                if(
                    context.classContext &&
                    context.classContext.isSubclassOf(class_context) &&
                    context.findName("$this")
                ) {
                    // TODO this doesn't distinguish between methods and constants
                    types = class_context.findInstanceIdentifier(
                        this.offset.name,
                        context.classContext
                    )
                    if(!(types && !types.isMixed)) {
                        types = class_context.findStaticIdentifier(
                            this.offset.name,
                            context.classContext
                        )
                    }
                } else {
                    types = class_context.findStaticIdentifier(
                        this.offset.name,
                        context.classContext
                    )
                }
                if(types && !types.isMixed) {
                    return new ContextTypes(types)
                } else if(
                    this.what instanceof ConstRef &&
                    this.what.name == "static"
                ) {
                    if(WARN_UNDECLARED_STATIC) {
                        PHPStrictError.warn(
                            `Undeclared static property static::${this.offset.name}`,
                            context,
                            this.node.loc
                        )
                    }
                    class_context.addIdentifier(
                        this.offset.name,
                        "public",
                        true,
                        new PHPType.Mixed().union
                    )
                    return new ContextTypes(new PHPType.Mixed().union)
                } else if(types) {
                    return new ContextTypes(types)
                } else {
                    let context_name = context.classContext && context.classContext.name || "non-class code"
                    this.throw(new PHPError.NoStaticProperty(
                        `No accessible static property ${resolved_name}::${this.offset.name} (from ${context_name})\n` +
                        `Accessible properties are: ${class_context.accessibleStaticIdentifiers.sort()}`
                    ), context)
                    return new ContextTypes(new PHPType.Mixed().union)
                }
            }
        } else if(
            this.offset instanceof OffsetLookup ||
            this.offset instanceof Variable
        ) {
            // Bar::$FOO
            // TODO
            //this.offset.check(context)
            return new ContextTypes(new PHPType.Mixed().union)
        } else {
            console.log(this.node)
            console.log("TODO don't know how to check this kind of lookup")
        }
        return ContextTypes.empty
    }
}
