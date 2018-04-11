import Declaration from "./declaration"
import Identifier from "./identifier"
import {PHPSimpleType} from "../php-type"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
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
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        let type
        if(this.type) {
            let type_name = context.resolveName(this.type.name, this.type.resolution)
            type = PHPSimpleType.named(type_name)
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
