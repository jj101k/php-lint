import _Any from "./any"

/**
 * A simple type expression (eg string, int)
 */
export default class _Simple extends _Any {
    /**
     * Builds the object
     * @param {string} type_name
     * @param {*[]} [values]
     * @param {boolean} [poly_value]
     */
    constructor(type_name, values = [], poly_value = false) {
        super()
        if(!type_name) {
            throw new Error("Simple type with no name")
        }
        this.typeName = type_name
        this.values = values
        this.polyValue = poly_value
    }
    /**
     * @type {?this}
     */
    get asFalse() {
        switch(this.typeName) {
            case "bool":
                if(this.values.some(v => v === false) || !this.values.length) {
                    return new _Simple(this.typeName, [false])
                } else {
                    return null
                }
            case "object":
            case "self":
                return null
            case "float":
            case "int":
                if(this.polyValue || !this.values.length || this.values.some(v => v === 0)) {
                    return new _Simple(this.typeName, [0])
                } else {
                    return null
                }
            case "null":
            case "void":
                return this
            case "string":
                if(this.polyValue || !this.values.length) {
                    return new _Simple(this.typeName, ["", "0"])
                } else if(this.values.some(v => v === "0" || v === "")) {
                    return new _Simple(this.typeName, this.values.filter(v => v === "0" || v === ""))
                } else {
                    return null
                }
            default:
                return false
        }
    }
    /**
     * @type {?this}
     */
    get asTrue() {
        switch(this.typeName) {
            case "bool":
                if(this.values.some(v => v === true) || !this.values.length) {
                    return new _Simple(this.typeName, [true])
                } else {
                    return null
                }
            case "object":
            case "self":
                return this
            case "float":
            case "int":
                if(this.polyValue || !this.values.length || this.values.some(v => v !== 0)) {
                    return new _Simple(this.typeName, this.values.filter(v => v !== 0), this.polyValue)
                } else {
                    return null
                }
            case "null":
            case "void":
                return null
            case "string":
                if(this.polyValue || !this.values.length) {
                    return new _Simple(this.typeName, this.values.filter(v => v !== "0" && v !== ""), this.polyValue)
                } else if(this.values.some(v => v !== "0" && v !== "")) {
                    return new _Simple(this.typeName, this.values.filter(v => v !== "0" && v !== ""), this.polyValue)
                } else {
                    return null
                }
            default:
                return this
        }
    }
    /**
     * @type {string} A string representation of the type, as meaningful for type
     * checking.
     */
    get typeSignature() {
        return this.typeName
    }
    /**
     * @type {*[]}
     */
    get values() {
        return this._values
    }
    set values(v) {
        this._values = v
    }
    /**
     * Returns a type combining this with the other. The eventual values will
     * generally be a union.
     * @param {_Simple} other_type
     * @throws if the two object types are not identical
     * @returns {_Simple}
     */
    combineWith(other_type) {
        super.combineWith(other_type)
        if(this.values.length && other_type.values.length) {
            if(this.values.length + other_type.values.length >= 10) {
                return new _Simple(
                    this.typeName,
                    [],
                    true
                )
            } else {
                return new _Simple(
                    this.typeName,
                    this.values.concat(other_type.values)
                )
            }
        } else if(this.values.length || this.polyValue) {
            return this
        } else {
            return other_type
        }
    }

    /**
     * Returns true if this type does not violate behaviour defined by the
     * supplied type. In this case, it also cares about ancestor classes and
     * interfaces, so <subclass> complies with <superclass> and <implementation>
     * complies with <interface> but not nice versa in either case.
     *
     * @param {_Any} other_type
     * @param {(string) => string[]} resolver
     * @returns {boolean}
     */
    compliesWith(other_type, resolver) {
        return(
            super.compliesWith(other_type, resolver) ||
            this.resolvedTypeHierarchy(resolver).some(
                t => t.matches(other_type)
            )
        )
    }
    /**
     *
     * @param {this} t
     * @returns {?this}
     */
    difference(t) {
        if(this.polyValue && t.polyValue) {
            return null
        } else if(!this.values.length && !t.values.length) {
            return null
        } else {
            let values = this.values.filter(v => !t.values.some(tv => tv === v))
            if(values.length) {
                return new _Simple(this.typeName, values)
            } else {
                return null
            }
        }
    }
    /**
     *
     * @param {this} t
     * @returns {this}
     */
    intersection(t) {
        if(this.polyValue && t.polyValue) {
            return this
        } else if(!this.values.length && !t.values.length) {
            return this
        } else {
            let values = this.values.filter(v => t.values.some(tv => tv === v))
            if(values.length) {
                return new _Simple(this.typeName, values)
            } else {
                return null
            }
        }
    }
    /**
     * Returns all the types this one matches, including all ancestors and
     * interfaces.
     *
     * @param {(string) => string[]} resolver
     * @returns {_Simple[]}
     */
    resolvedTypeHierarchy(resolver) {
        if(!this._resolvedTypeHierarchy) {
            this._resolvedTypeHierarchy = resolver(this.typeSignature).map(n => new _Simple(n))
        }
        return this._resolvedTypeHierarchy
    }
    /**
     * @type {string} Represents best expression of the object, rather than
     * simply its type signature.
     */
    toString() {
        if(this.values.length) {
            switch(this.typeName) {
                case "string":
                    return this.values.map(
                        v => `"${v}"`
                    ).join(" | ")
                case "int":
                case "float":
                    return this.values.map(
                        v => +v
                    ).join(" | ")
                case "bool":
                    return this.values.map(
                        v => "" + !!v
                    ).join(" | ")
            }
        }
        return this.typeName
    }
    /**
     * Adds a known value
     * @param {string | number | boolean} v
     * @returns {_Simple}
     */
    withValue(v) {
        if(this.polyValue) {
            return this
        } else if(this.values.length) {
            if(this.values.length + 1 >= 10) {
                this.polyValue = true
                this.values = []
            } else {
                this.values.push(v)
            }
            return this
        } else {
            return new _Simple(this.typeName, [v])
        }
    }
}
