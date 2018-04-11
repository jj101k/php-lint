import _Union from "./union"
/**
 * A representation of any type
 */
export default class _Any {
    /**
     * @type {string} A string representation of the type as meaningful for type
     * checking, so that if the value matches between two objects you can take
     * it that they have the same type, even if they represent different values.
     */
    get typeSignature() {
        return "mixed"
    }
    /**
     * A new type union containing this.
     * @returns {_Union}
     */
    get union() {
        return new _Union(this)
    }
    /**
     * @type {?*[]} The values this instance can have. N/A for anything but a
     * simple type.
     */
    get values() {
        return null
    }
    /**
     * Returns a type combining this one with another. Only meaningful for types
     * which preserve values, for which the end type will have a union of
     * values (usually).
     *
     * @param {_Any} other_type
     * @throws if the two object types are not identical
     * @returns {_Any}
     */
    combineWith(other_type) {
        if(this.typeSignature != other_type.typeSignature) {
            throw new Error(
                `Cannot combine different types ${this.typeSignature} and ${other_type.typeSignature}`
            )
        }
        return this
    }

    /**
     * Returns true if this type is a subset of the supplied type.
     *
     * @param {_Any} other_type
     * @returns {boolean}
     */
    compatibleWith(other_type) {
        return(
            this.matches(other_type) ||
            (
                this.typeSignature.match(/\[\]$/) &&
                other_type.typeSignature == "array"
            ) ||
            (
                this.typeSignature.match(/\[\]$/) &&
                other_type.typeSignature == "mixed[]"
            )
        )
    }

    /**
     * Returns true if both have the same type.
     *
     * @param {_Any} other_type
     * @returns {boolean}
     */
    matches(other_type) {
        return(
            other_type === this ||
            other_type.typeSignature == this.typeSignature
        )
    }
    /**
     * @type {string} Represents best expression of the object, rather than
     * simply its type signature.
     */
    toString() {
        return this.typeSignature
    }
    /**
     * Adds a known value
     * @param {string | number | boolean} v
     * @returns {_Any}
     */
    withValue(v) {
        return this
    }
}