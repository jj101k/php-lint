import _Any from "./any"
import _Core from "./core"
import _Union from "./union"
/**
 * An map of strings to some types.
 */
export default class _AssociativeArray extends _Any {
    /**
     *
     * @param {_Union} member_type
     */
    constructor(member_type = null) {
        super()
        this.memberType = member_type
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
     * @returns {boolean}
     */
    compliesWith(expected_type) {
        if(expected_type instanceof _AssociativeArray) {
            return this.memberType.compliesWith(expected_type.memberType)
        } else {
            return super.compliesWith(expected_type)
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