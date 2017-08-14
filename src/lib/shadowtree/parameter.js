import Context from "../context"
import ContextTypes from "../context-types"
import Declaration from "./declaration"
import Identifier from "./identifier"
import {PHPSimpleType} from "../phptype"
import Doc from "./doc"
import _Node from "./node"
import ConstRef from "./constref"
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
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        let type
        if(this.type) {
            let type_name = this.type.name
            let md
            if(
                this.type.resolution == "fqn" &&
                (md = type_name.match(/^\u005c(.+)/)) &&
                PHPSimpleType.coreTypes[md[1]]
            ) {
                type_name = md[1]
            }
            type = PHPSimpleType.named(context.resolveName(type_name))
        } else {
            type = PHPSimpleType.coreTypes.mixed
        }
        if(
            this.nullable ||
            (
                this.value &&
                this.value instanceof ConstRef &&
                this.value.name instanceof Identifier &&
                this.value.name.name.toLowerCase() == "null"
            )
        ) {
            type = type.addTypesFrom(PHPSimpleType.coreTypes.null)
        }
        context.setName(
            "$" + this.name,
            type
        )
        return new ContextTypes(type)
    }
}
