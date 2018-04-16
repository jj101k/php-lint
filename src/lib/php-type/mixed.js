import _Any from "./any"
import _Union from "./union"
/**
 * Unknown type
 */
export default class _Mixed extends _Any {
    /**
     *
     * @param {?string} [origin_class]
     * @param {?string} [origin_symbol]
     */
    constructor(origin_class = null, origin_symbol = null) {
        super()
        this.originClass = origin_class
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
     * @type {string} Represents best expression of the object, rather than
     * simply its type signature.
     */
    toString() {
        if(this.originSymbol) {
            if(this.originClass) {
                return `${this.typeSignature}?${this.originClass}\\${this.originSymbol}`
            } else {
                return `${this.typeSignature}?${this.originSymbol}`
            }
        } else {
            return this.typeSignature
        }
    }
}