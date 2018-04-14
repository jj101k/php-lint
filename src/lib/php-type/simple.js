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
        this.typeName = type_name
        this.values = values
        this.polyValue = poly_value
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