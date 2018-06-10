import _Any from "./any"

/**
 * A set of types
 */
class _Set {
    /**
     * @param {?_Any} [initial_type]
     */
    constructor(initial_type = null) {
        if(this.constructor === _Set) {
            throw new Error("Abstract class, do not instantiate")
        }
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


/**
 * A set of optional types
 */
export class _Union extends _Set {
    /**
     * Adds types. Returns a derived type union which may not be either
     * original. Both sets should be considered mutable for this purpose.
     *
     * @param {_Union[]} sets
     * @returns {?_Union}
     */
    static combine(...sets) {
        let non_empty = sets.filter(
            s => s.types.length > 0
        )
        if(non_empty.length <= 1) {
            return non_empty[0] || sets[0]
        } else if(non_empty[0].types.length == 1) {
            let n = non_empty[0].copy()
            non_empty.slice(1).forEach(
                s => Object.assign(n.uniqueTypes, s.uniqueTypes)
            )
            return n
        } else {
            let n = non_empty[0]
            non_empty.slice(1).forEach(s => {
                Object.keys(s.uniqueTypes).forEach(
                    k => {
                        if(n.uniqueTypes[k]) {
                            let merge_type = n.uniqueTypes[k].combineWith(
                                s.uniqueTypes[k]
                            )
                            if(merge_type !== n.uniqueTypes[k]) {
                                n.uniqueTypes[k] = merge_type
                            }
                        } else {
                            n.uniqueTypes[k] = s.uniqueTypes[k]
                        }
                    }
                )
            })
            return non_empty[0]
        }
    }

    /**
     * An empty type union
     * @type {_Union}
     */
    static get empty() {
        return new _Union()
    }

    /**
     * @type {_Union} The same set, assuming that the value evaluates to false.
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
     * @type {_Union} The same set, assuming that the value evaluates to true.
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
     * @returns {_Union} The same object, but empty. Used for rebuilding the set.
     */
    get emptyCopy() {
        return new _Union()
    }

    /**
     * @type {boolean} True if this is a "mixed" type
     */
    get isMixed() {
        return(
            this.types.some(
                t => t.isMixed
            )
        )
    }

    /**
     * @type {string} A string representation of the types, as meaningful for type
     * checking.
     */
    get typeSignature() {
        if(this.isEmpty) {
            return "void"
        } else {
            return this.types.map(t => t.typeSignature).join(" | ")
        }
    }

    /**
     * Returns true if this set of types does not violate behaviour defined by
     * the supplied set of types. In other words, every type here must be
     * compliant with at least one type on the supplied union.
     *
     * (int) is compliant with (int|null); (int|null) is not compliant with (int).
     *
     * @param {?_Union} expected_type The other type
     * @param {(string) => string[]} resolver
     * @returns {boolean}
     */
    compliesWith(expected_type, resolver) {
        if(!expected_type) {
            return false;
        }
        return (
            expected_type.isMixed ||
            this === expected_type ||
            this.types.every(
                t => expected_type.types.some(et => t.compliesWith(et, resolver))
            )
        )
    }

    /**
     * Produces a copy of this union, to shadow a variable copy
     *
     * @returns {_Union}
     */
    copy() {
        let n = this.emptyCopy
        Object.assign(n.uniqueTypes, this.uniqueTypes)
        return n
    }

    /**
     * Returns this & ~union
     * @param {_Union} union
     * @returns {_Union}
     */
    difference(union) {
        let n = new _Union()
        Object.keys(this.uniqueTypes).forEach(
            t => {
                if(!union.uniqueTypes[t]) {
                    n.addType(this.uniqueTypes[t])
                } else {
                    let tv = this.uniqueTypes[t].difference(union.uniqueTypes[t])
                    if(tv) {
                        n.addType(tv)
                    }
                }
            }
        )
        return n
    }

    /**
     * Returns a derived type union which may not be the original, without the
     * named type.
     *
     * @param {string} type
     * @returns {_Union}
     */
    excluding(type) {
        if(this.uniqueTypes[type]) {
            let n = this.copy()
            delete n.uniqueTypes[type]
            return n
        } else {
            return this
        }
    }

    /**
     * Returns the intersection of two unions - which is to say, a union for
     * which every type is compatible with at least one type on each side.
     *
     * Under normal circumstances (one type on each side) this means that you
     * get whichever is the subtype, or nothing.
     *
     * @param {_Union} union
     * @param {(name: string) => string[]} resolver
     * @returns {_Union}
     */
    intersection(union, resolver) {
        let n = new _Union()
        Object.values(this.uniqueTypes).forEach(
            v => Object.values(union.uniqueTypes).filter(
                uv => !!uv.compliesWith(v, resolver)
            ).forEach(
                uv => {
                    let tv = v.intersection(uv)
                    if(tv) {
                        n.addType(tv)
                    }
                }
            )
        )
        Object.values(union.uniqueTypes).forEach(
            v => Object.values(this.uniqueTypes).filter(
                uv => !!uv.compliesWith(v, resolver)
            ).forEach(
                uv => {
                    let tv = v.intersection(uv)
                    if(tv) {
                        n.addType(tv)
                    }
                }
            )
        )
        return n
    }

    /**
     * @type {string} Represents best expression of the object, rather than
     * simply its type signature.
     */
    toString() {
        if(this.isEmpty) {
            return "void"
        } else {
            return this.types.join(" | ")
        }
    }

    /**
     * Adds a known value
     *
     * @param {string | number | boolean} v
     * @returns {_Union}
     */
    withValue(v) {
        if(this.types.length == 1) {
            let n = new _Union()
            n.uniqueTypes = {
                [this.types[0].typeSignature]: this.types[0].withValue(v),
            }
            return n
        } else {
            return this
        }
    }
}


/**
 * A set of required types
 */
export class _Intersection extends _Set {
    /**
     * An empty type intersection
     * @type {_Intersection}
     */
    static get empty() {
        return new _Intersection()
    }

    /**
     * @type {_Intersection} The same set, assuming that the value evaluates to false.
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
     * @type {_Intersection} The same set, assuming that the value evaluates to true.
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
     * @returns {_Intersection} The same object, but empty. Used for rebuilding the set.
     */
    get emptyCopy() {
        return new _Intersection()
    }

    /**
     * @type {boolean} True if this is a "mixed" type
     */
    get isMixed() {
        return(
            this.types.every(
                t => t.isMixed
            )
        )
    }

    /**
     * @type {string} A string representation of the types, as meaningful for type
     * checking.
     */
    get typeSignature() {
        if(this.isEmpty) {
            return "void"
        } else {
            return this.types.map(t => t.typeSignature).join(" & ")
        }
    }

    /**
     * Adds types. Returns a derived type union which may not be the original.
     * @param {_Intersection} intersection
     * @returns {_Intersection}
     */
    addTypesFrom(intersection) {
        if(this.types.length == 0) {
            return intersection
        } else if(this.types.length == 1) {
            let n = this.copy()
            Object.assign(n.uniqueTypes, intersection.uniqueTypes)
            return n
        } else {
            Object.keys(intersection.uniqueTypes).forEach(
                k => {
                    if(this.uniqueTypes[k]) {
                        let merge_type = this.uniqueTypes[k].combineWith(
                            intersection.uniqueTypes[k]
                        )
                        if(merge_type !== this.uniqueTypes[k]) {
                            this.uniqueTypes[k] = merge_type
                        }
                    } else {
                        this.uniqueTypes[k] = intersection.uniqueTypes[k]
                    }
                }
            )
            return this
        }
    }

    /**
     * Returns true if this set of types does not violate behaviour defined by
     * the supplied set of types. In other words, every type here must be
     * compliant with at least one type on the supplied intersection.
     *
     * (int) is compliant with (int|null); (int|null) is not compliant with (int).
     *
     * @param {?_Intersection} expected_type The other type
     * @param {(string) => string[]} resolver
     * @returns {boolean}
     */
    compliesWith(expected_type, resolver) {
        if(!expected_type) {
            return false;
        }
        return (
            expected_type.isMixed ||
            this === expected_type ||
            this.types.every(
                t => expected_type.types.some(et => t.compliesWith(et, resolver))
            )
        )
    }

    /**
     * Produces a copy of this union, to shadow a variable copy
     *
     * @returns {_Intersection}
     */
    copy() {
        let n = this.emptyCopy
        Object.assign(n.uniqueTypes, this.uniqueTypes)
        return n
    }

    /**
     * Returns this & ~intersection
     * @param {_Intersection} intersection
     * @returns {_Intersection}
     */
    difference(intersection) {
        let n = new _Intersection()
        Object.keys(this.uniqueTypes).forEach(
            t => {
                if(!intersection.uniqueTypes[t]) {
                    n.addType(this.uniqueTypes[t])
                } else {
                    let tv = this.uniqueTypes[t].difference(intersection.uniqueTypes[t])
                    if(tv) {
                        n.addType(tv)
                    }
                }
            }
        )
        return n
    }

    /**
     * Returns a derived type union which may not be the original, without the
     * named type.
     *
     * @param {string} type
     * @returns {_Intersection}
     */
    excluding(type) {
        if(this.uniqueTypes[type]) {
            let n = this.copy()
            delete n.uniqueTypes[type]
            return n
        } else {
            return this
        }
    }

    /**
     * Returns the intersection of two unions - which is to say, a union for
     * which every type is compatible with at least one type on each side.
     *
     * Under normal circumstances (one type on each side) this means that you
     * get whichever is the subtype, or nothing.
     *
     * @param {_Intersection} union
     * @param {(name: string) => string[]} resolver
     * @returns {_Intersection}
     */
    intersection(union, resolver) {
        let n = new _Intersection()
        Object.values(this.uniqueTypes).forEach(
            v => Object.values(union.uniqueTypes).filter(
                uv => !!uv.compliesWith(v, resolver)
            ).forEach(
                uv => {
                    let tv = v.intersection(uv)
                    if(tv) {
                        n.addType(tv)
                    }
                }
            )
        )
        Object.values(union.uniqueTypes).forEach(
            v => Object.values(this.uniqueTypes).filter(
                uv => !!uv.compliesWith(v, resolver)
            ).forEach(
                uv => {
                    let tv = v.intersection(uv)
                    if(tv) {
                        n.addType(tv)
                    }
                }
            )
        )
        return n
    }

    /**
     * @type {string} Represents best expression of the object, rather than
     * simply its type signature.
     */
    toString() {
        if(this.isEmpty) {
            return "void"
        } else {
            return this.types.join(" | ")
        }
    }

    /**
     * Adds a known value
     *
     * @param {string | number | boolean} v
     * @returns {_Intersection}
     */
    withValue(v) {
        if(this.types.length == 1) {
            let n = new _Intersection()
            n.uniqueTypes = {
                [this.types[0].typeSignature]: this.types[0].withValue(v),
            }
            return n
        } else {
            return this
        }
    }
}

export default _Set