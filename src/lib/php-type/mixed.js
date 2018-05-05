import _Any from "./any"
import _Union from "./union"
import _Core from "./core";
/**
 * Unknown type
 */
export default class _Mixed extends _Any {
    /**
     *
     * @param {?string} [origin_class] eg. "\DateTime"
     * @param {?string} [origin_symbol] eg. "modify"
     * @param {?string} [origin_hint] eg. "call", usually only helpful where no
     * symbol is known.
     */
    constructor(origin_class = null, origin_symbol = null, origin_hint = null) {
        super()
        this.originClass = origin_class
        this.originHint = origin_hint
        this.originSymbol = origin_symbol
    }

    /**
     * @type {string} A string representation of the type, as meaningful for type
     * checking.
     */
    get typeSignature() {
        return "mixed"
    }
    /**
     * Returns a type combining this with the other. This will generally drop
     * the origin data.
     *
     * @param {_Mixed} other_type
     * @throws if the two object types are not identical
     * @returns {_Mixed}
     */
    combineWith(other_type) {
        super.combineWith(other_type)
        if(!other_type.originSymbol) {
            return other_type
        } else if(!this.originSymbol) {
            return this
        } else {
            return this
        }
    }
    /**
     * @type {string} Represents best expression of the object, rather than
     * simply its type signature.
     */
    toString() {
        if(this.originSymbol) {
            if(this.originClass) {
                return `${this.typeSignature}?${this.originClass}::${this.originSymbol}`
            } else {
                return `${this.typeSignature}?${this.originSymbol}`
            }
        } else if(this.originHint) {
            return `${this.typeSignature}~${this.originHint}`
        } else {
            return this.typeSignature
        }
    }
}