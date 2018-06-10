import _Any from "./any"

/**
 * A set of types
 */
export default class _Set {
    /**
     * @param {?_Any} [initial_type]
     */
    constructor(initial_type = null) {
        /** @type {{[x: string]: _Any}} */
        this.uniqueTypes = {}
        if(initial_type) {
            this.uniqueTypes[initial_type.typeSignature] = initial_type
        }
    }

    /**
     * @type {_Set} The same set, assuming that the value evaluates to false.
     */
    get asFalse() {
        let type = this.emptyCopy
        this.types.forEach(v => {
            let f = v.asFalse
            if(f) type.addType(f)
        })
        return type
    }

    /**
     * @type {_Set} The same set, assuming that the value evaluates to true.
     */
    get asTrue() {
        let type = this.emptyCopy
        this.types.forEach(v => {
            let t = v.asTrue
            if(t) type.addType(t)
        })
        return type
    }

    /**
     * @returns {_Set} The same object, but empty. Used for rebuilding the set.
     */
    get emptyCopy() {
        throw new Error("Not implemented")
    }

    /**
     * @type {boolean} Returns true if this is the empty set
     */
    get isEmpty() {
        return !this.types.length
    }

    /**
     * @type {boolean} True if this is a "mixed" type
     */
    get isMixed() {
        throw new Error("Not implemented")
    }

    /**
     * @type {_Any[]}
     */
    get types() {
        return Object.values(this.uniqueTypes)
    }

    /**
     * @type {string} A string representation of the types, as meaningful for type
     * checking.
     */
    get typeSignature() {
        throw new Error("Not implemented")
    }

    /**
     * @type {string} As typeSignature but bracketed if needed.
     */
    get typeSignatureToken() {
        if(this.types.length > 1) {
            return `(${this.typeSignature})`
        } else {
            return this.typeSignature
        }
    }

    /**
     * Adds a type. Returns a derived type set which may not be the original.
     *
     * @param {_Any} type
     * @returns {_Set}
     */
    addType(type) {
        let merge_type = this.uniqueTypes[type.typeSignature]
        let new_type = merge_type ? merge_type.combineWith(type) : type
        if(merge_type && merge_type === new_type) {
            return this
        }
        if(this.types.length == 1) {
            let n = this.emptyCopy
            n.uniqueTypes = Object.assign(
                {
                    [type.typeSignature]: new_type,
                },
                this.uniqueTypes
            )
            return n
        } else {
            this.uniqueTypes[type.typeSignature] = new_type
            return this
        }
    }

    /**
     * Returns all the known values coerced into the given type. If the values
     * are not all known, this will be null.
     *
     * @param {string} type eg "bool"
     * @returns {?Object[]} All values should be distinct.
     */
    coercedValues(type) {
        if(this.isEmpty) return null
        if(this.types.some(t => !(t.values && t.values.length))) return null
        let out = {}
        switch(type) {
            case "bool":
                this.types.forEach(t => t.values.forEach(v => {
                    out[+!!v] = !!v
                }))
                return Object.values(out)
            case "string":
                this.types.forEach(t => t.values.forEach(v => {
                    out["" + v] = "" + v
                }))
                return Object.values(out)
            default:
                console.log(`Coercion to ${type} not yet implemented`)
                return null
        }
    }

    /**
     * Produces a copy of this union, to shadow a variable copy
     *
     * @returns {_Set}
     */
    copy() {
        let n = this.emptyCopy
        Object.assign(n.uniqueTypes, this.uniqueTypes)
        return n
    }

    /**
     * @type {string} Represents best expression of the object, rather than
     * simply its type signature.
     */
    toString() {
        throw new Error("Not implemented")
    }

    /**
     * Adds a known value
     *
     * @param {string | number | boolean} v
     */
    withValue(v) {
        if(this.types.length == 1) {
            let n = this.emptyCopy
            n.uniqueTypes = {
                [this.types[0].typeSignature]: this.types[0].withValue(v),
            }
            return n
        } else {
            return this
        }
    }
}