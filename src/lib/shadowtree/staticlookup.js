import Context from "../context"
import ContextTypes from "../context-types"
import Lookup from "./lookup"
import OffsetLookup from "./offsetlookup"
import {PHPTypeUnion} from "../phptype"
import Identifier from "./identifier"
import Variable from "./variable"
import ConstRef from "./constref"
import PHPStrictError from "../phpstricterror"
export default class StaticLookup extends Lookup {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let class_context
        let resolved_name
        if(this.what instanceof Variable) {
            this.what.check(context)
            // $x::$y
            //this.offset.check(context)
            return new ContextTypes(PHPTypeUnion.mixed)
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
                    types = class_context.findInstanceIdentifier(this.offset.name, context.classContext)
                    if(!(types && types !== PHPTypeUnion.mixed)) {
                        types = class_context.findStaticIdentifier(this.offset.name, context.classContext)
                    }
                } else {
                    types = class_context.findStaticIdentifier(this.offset.name, context.classContext)
                }
                if(types && types !== PHPTypeUnion.mixed) {
                    return new ContextTypes(types)
                } else if(this.what instanceof ConstRef && this.what.name == "static") {
                    PHPStrictError.warn(
                        `Undeclared static property static::${this.offset.name}`,
                        context,
                        this.node.loc
                    )
                    class_context.addIdentifier(
                        this.offset.name,
                        "public",
                        true,
                        PHPTypeUnion.mixed
                    )
                    return new ContextTypes(PHPTypeUnion.mixed)
                } else {
                    throw new PHPStrictError(
                        `No accessible identifier ${resolved_name}::${this.offset.name}`,
                        context,
                        this.loc
                    )
                }
            }
        } else if(
            this.offset instanceof OffsetLookup ||
            this.offset instanceof Variable
        ) {
            // Bar::$FOO
            // TODO
            //this.offset.check(context)
            return new ContextTypes(PHPTypeUnion.mixed)
        } else {
            console.log(this.node)
            console.log("TODO don't know how to check this kind of lookup")
        }
        return ContextTypes.empty
    }
}