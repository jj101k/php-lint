import _Any from "./any"
import _AssociativeArray from "./associative-array"
import _Core from "./core"
import _Union from "./union"
/**
 * An array of some types.
 */
export default class _IndexedArray extends _Any {
    /**
     *
     * @param {_Union} member_type
     */
    constructor(member_type) {
        super()
        this.memberType = member_type.copy()
        this.isEmpty = null
    }
    /**
     * @type {?this}
     */
    get asFalse() {
        if(this.isEmpty !== true) {
            let out = new _AssociativeArray()
            out.isEmpty = true
            return out
        } else {
            return null
        }
    }
    /**
     * @type {?this}
     */
    get asTrue() {
        if(this.isEmpty !== false) {
            let out = new _AssociativeArray(this.memberType)
            out.isEmpty = true
            return out
        } else {
            return null
        }
    }
    /**
     * @type {string} A string representation of the type, as meaningful for type
     * checking.
     */
    get typeSignature() {
        return `${this.memberType.typeSignatureToken}[]`
    }

    /**
     * Returns true if this type does not violate the expectations of another
     * array type.
     *
     * Please note that indexed arrays always comply with associative arrays of
     * the same type.
     *
     * @param {_Any} expected_type The other array type
     * @param {(string) => string[]} resolver
     * @returns {boolean}
     */
    compliesWith(expected_type, resolver) {
        if(expected_type instanceof _IndexedArray) {
            return this.memberType.compliesWith(expected_type.memberType, resolver)
        } else if(expected_type instanceof _AssociativeArray) {
            return this.memberType.compliesWith(expected_type.memberType, resolver)
        } else {
            return super.compliesWith(expected_type, resolver)
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