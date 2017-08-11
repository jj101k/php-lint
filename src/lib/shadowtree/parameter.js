import Context from "../context"
import ContextTypes from "../context-types"
import Declaration from "./declaration"
import Identifier from "./identifier"
import {PHPSimpleType} from "../phptype"
export default class Parameter extends Declaration {
    /** @type {boolean} */
    get byref() {
        return this.node.byref
    }
    /** @type {boolean} */
    get nullable() {
        return this.node.nullable
    }
    /** @type {?Identifier} */
    get type() {
        return this.cacheNode("type")
    }
    /** @type {?_Node} */
    get value() {
        return this.cacheNode("value")
    }
    /** @type {boolean} */
    get variadic() {
        return this.node.variadic
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        let type
        if(this.type) {
            type = PHPSimpleType.named(this.type.name)
        } else {
            type = PHPSimpleType.coreTypes.mixed
        }
        if(this.nullable) {
            type.addTypesFrom(PHPSimpleType.coreTypes.null)
        }
        context.setName(
            "$" + this.name,
            type
        )
        return new ContextTypes(type)
    }
}
