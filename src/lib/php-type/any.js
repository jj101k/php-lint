import _Union from "./union"
/**
 * A representation of any type
 */
export default class _Any {
    /**
     * Any expression of this type which can be false
     * @type {?this}
     */
    get asFalse() {
        throw new Error("Not implemented")
    }
    /**
     * Any expression of this type which can be false
     * @type {?this}
     */
    get asTrue() {
        throw new Error("Not implemented")
    }
    get isMixed() {
        return false
    }
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
                `Cannot combine different types ${this} and ${other_type}`
            )
        }
        return this
    }

    /**
     * Returns true if this type does not violate behaviour defined by the
     * supplied type. As an example, "int" complies with "string" because it can
     * just be coerced, whereas "string" doesn't comply with "int" because it
     * may not represent a numeric value.
     *
     * @param {_Any} other_type
     * @param {(string) => string[]} resolver
     * @returns {boolean}
     */
    compliesWith(other_type, resolver) {
        return this.matches(other_type)
    }
    /**
     *
     * @param {this} t
     * @returns {?this}
     */
    difference(t) {
        return null
    }
    /**
     *
     * @param {this} t
     * @returns {?this}
     */
    intersection(t) {
        return this
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