import _Any from "./any"
import _Core from "./core"
import _Union from "./union"
/**
 * An array of some types.
 */
export default class _IndexedArray extends _Any {
    /**
     *
     * @param {?_Union} type
     */
    constructor(type) {
        super()
        this.type = type || _Core.types.void
    }
    /**
     * @type {string} A string representation of the type, as meaningful for type
     * checking.
     */
    get typeSignature() {
        return `${this.type.typeSignatureToken}[]`
    }

    /**
     * Returns true if this array type and another are mutually compatible.
     *
     * @param {_Any} expected_type The other array type
     * @returns {boolean}
     */
    compatibleWith(expected_type) {
        if(expected_type instanceof _IndexedArray) {
            return this.type.compatibleWith(expected_type.type)
        } else {
            return expected_type.typeSignature == "array"
        }
    }

    /**
     * @type {string} Represents best expression of the object, rather than
     * simply its type signature.
     */
    toString() {
        return this.typeSignature
    }
}