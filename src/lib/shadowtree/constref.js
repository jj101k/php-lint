import Context from "../context"
import ContextTypes from "../context-types"
import Expression from "./expression"
import Doc from "./doc"
import {PHPSimpleType, PHPTypeUnion} from "../phptype"
import Identifier from "./identifier"
export default class ConstRef extends Expression {
    /** @type {string|Identifier} */
    get name() {
        return this.cacheOptionalNode("name")
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
        if(this.name instanceof Identifier) {
            switch(this.name.name) {
                case "array":
                    return new ContextTypes(PHPSimpleType.named(this.name.name))
                default:
            }
            let constant_type = context.findName(this.name.name)
            if(constant_type) {
                return new ContextTypes(constant_type)
            }
            let constant_type_munged = context.findName(this.name.name.toUpperCase())
            if(constant_type_munged) {
                return new ContextTypes(constant_type_munged)
            }
        }
        let classContext = context.findClass(context.resolveNodeName(this))
        if(classContext) {
            return new ContextTypes(PHPSimpleType.named(classContext.name))
        } else {
            return new ContextTypes(PHPSimpleType.coreTypes.mixed)
        }
    }
}
