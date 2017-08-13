import Context from "../context"
import ContextTypes from "../context-types"
import Declaration from "./declaration"
import {PHPTypeUnion, PHPSimpleType} from "../phptype"
import _Node from "./node"
export default class Constant extends Declaration {
    /** @type {?_Node} */
    get value() {
        return this.cacheNode("value")
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
        let types
        if(this.value) {
            types = this.value.check(context).expressionType
        } else {
            types = PHPSimpleType.coreTypes.mixed
        }
        context.classContext.addIdentifier(this.name, "public", true, types)
        return ContextTypes.empty
    }
}
