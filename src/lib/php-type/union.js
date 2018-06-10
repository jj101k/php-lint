import _Set from "./set"

/**
 * A set of optional types
 */
export default class _Union extends _Set {
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
     * Adds types. Returns a derived type union which may not be the original.
     * @param {_Union} union
     * @returns {_Union}
     */
    addTypesFrom(union) {
        if(this.types.length == 0) {
            return union
        } else if(this.types.length == 1) {
            let n = this.copy()
            Object.assign(n.uniqueTypes, union.uniqueTypes)
            return n
        } else {
            Object.keys(union.uniqueTypes).forEach(
                k => {
                    if(this.uniqueTypes[k]) {
                        let merge_type = this.uniqueTypes[k].combineWith(
                            union.uniqueTypes[k]
                        )
                        if(merge_type !== this.uniqueTypes[k]) {
                            this.uniqueTypes[k] = merge_type
                        }
                    } else {
                        this.uniqueTypes[k] = union.uniqueTypes[k]
                    }
                }
            )
            return this
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
     *
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