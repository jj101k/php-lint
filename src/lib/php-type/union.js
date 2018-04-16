import _Any from "./any"
/**
 * A set of possible types
 */
export default class _Union {
    /**
     * An empty type union
     * @type {_Union}
     */
    static get empty() {
        return new _Union()
    }

    /**
     * @param {?_Any} [initial_type]
     */
    constructor(initial_type = null) {
        /** @type {{[x: string]: _Any}} */
        this.uniqueTypes = {}
        if(initial_type) {
            this.uniqueTypes["" + initial_type] = initial_type
        }
    }
    /**
     * @type {boolean}
     */
    get isEmpty() {
        return !this.types.length
    }
    /**
     * @type {boolean} True if this is a "mixed" type
     */
    get isMixed() {
        return(
            this.types.some(
                t => t.typeSignature == "mixed"
            )
        )
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
        if(this.isEmpty) {
            return "void"
        } else {
            return this.types.map(t => t.typeSignature).join(" | ")
        }
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
     * Adds a type. Returns a derived type union which may not be the original.
     * @param {_Any} type
     * @returns {_Union}
     */
    addType(type) {
        let merge_type = this.uniqueTypes[type.typeSignature]
        let new_type = merge_type ? merge_type.combineWith(type) : type
        if(merge_type && merge_type === new_type) {
            return this
        }
        if(this.types.length == 1) {
            let n = new _Union()
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
     * Adds types. Returns a derived type union which may not be the original.
     * @param {_Union} union
     * @returns {_Union}
     */
    addTypesFrom(union) {
        if(this.types.length == 0) {
            return union
        } else if(this.types.length == 1) {
            let n = new _Union()
            n.uniqueTypes = Object.assign({}, this.uniqueTypes, union.uniqueTypes)
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
     * Returns true if this set of types does not violate behaviour defined by
     * the supplied set of types. In other words, every type here must be
     * compliant with at least one type on the supplied union.
     *
     * (int) is compliant with (int|null); (int|null) is not compliant with (int).
     *
     * @param {?_Union} expected_type The other type
     * @returns {boolean}
     */
    compliesWith(expected_type) {
        if(!expected_type) {
            return false;
        }
        return (
            expected_type.isMixed ||
            this === expected_type ||
            this.types.every(
                t => expected_type.types.some(et => t.compliesWith(et))
            )
        )
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
            let n = new _Union()
            n.uniqueTypes = Object.assign({}, this.uniqueTypes)
            delete n.uniqueTypes[type]
            return n
        } else {
            return this
        }
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