import _Any from "./any"
import _Core from "./core"
import _Set from "./set"
/**
 * An map of strings to some types.
 */
export default class _AssociativeArray extends _Any {
    /**
     *
     * @param {_Set} member_type
     */
    constructor(member_type = null) {
        super()
        this.memberType = member_type ? member_type.copy() : null
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
        return "array"
    }

    /**
     * Returns true if this type does not violate the expectations of another
     * associative array type.
     *
     * Please note that associative arrays DO violate the expectations of
     * indexed arrays.
     *
     * @param {_Any} expected_type The other array type
     * @param {(string) => string[]} resolver
     * @returns {boolean}
     */
    compliesWith(expected_type, resolver) {
        if(expected_type instanceof _AssociativeArray) {
            if(!expected_type.memberType) {
                return true
            } else if(!this.memberType) {
                return false
            } else {
                return this.memberType.compliesWith(expected_type.memberType, resolver)
            }
        } else {
            return super.compliesWith(expected_type, resolver)
        }
    }

    /**
     * @type {string} Represents best expression of the object, rather than
     * simply its type signature.
     */
    toString() {
        if(this.memberType) {
            return `array<${this.memberType}>`
        } else {
            return `array<mixed>`
        }
    }
}