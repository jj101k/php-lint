import Context from "../context"
import ContextTypes from "../context-types"
import Declaration from "./declaration"
import {PHPTypeUnion} from "../phptype"
import _Node from "./node"
export default class Constant extends Declaration {
    /** @type {?_Node} */
    get value() {
        return this.cacheNode("value")
    }

    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let types
        if(this.value) {
            types = this.value.check(context).expressionType
        } else {
            types = PHPTypeUnion.mixed
        }
        context.classContext.addIdentifier(this.name, "public", true, types)
        return ContextTypes.empty
    }
}
