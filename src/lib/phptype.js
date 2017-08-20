class PHPType {
    /**
     * @type {string} A string representation of the type as meaningful for type
     * checking, so that if the value matches between two objects you can take
     * it that they have the same type, even if they represent different values.
     */
    get typeSignature() {
        return "mixed"
    }
    /**
     * A new PHPTypeUnion containing this.
     * @returns {PHPTypeUnion}
     */
    get union() {
        return new PHPTypeUnion(this)
    }
    /**
     * Returns a type combining this one with another. Only meaningful for types
     * which preserve values, for which the end type will have a union of
     * values (usually).
     *
     * @param {PHPType} other_type
     * @throws if the two object types are not identical
     * @returns {PHPType}
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
     * Returns true if both have the same type.
     *
     * @param {PHPType} other_type
     * @returns {boolean}
     */
    matches(other_type) {
        return other_type === this || other_type.typeSignature == this.typeSignature
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
     * @returns {PHPType}
     */
    withValue(v) {
        return this
    }
}

/**
 * @typedef coreTypes
 * @property {PHPTypeUnion} string
 * @property {PHPTypeUnion} int
 * @property {PHPTypeUnion} float
 * @property {PHPTypeUnion} bool
 * @property {PHPTypeUnion} array
 * @property {PHPTypeUnion} callable
 * @property {PHPTypeUnion} null
 * @property {PHPTypeUnion} mixed
 * @property {PHPTypeUnion} self
 * @property {PHPTypeUnion} object
 */

class PHPSimpleType extends PHPType {
    /** @type {coreTypes} */
    static get coreTypes() {
        if(!this._coreTypes) {
            let known_types = ["string", "int", "float", "bool", "array", "callable"]
            let pseudo_types = ["null", "mixed", "self", "object"]
            let types = {}
            known_types.forEach(
                type_name => types[type_name] = new PHPSimpleType(type_name).union
            )
            pseudo_types.forEach(
                type_name => types[type_name] = new PHPSimpleType(type_name).union
            )
            this._coreTypes = types
        }
        return this._coreTypes
    }
    /** @type {{[x: string]: PHPTypeUnion}} */
    static get types() {
        if(!this._types) {
            this._types = {}
        }
        return this._types
    }
    /**
     * Returns a cached type by name
     * @param {string} type_name
     * @returns {PHPTypeUnion}
     */
    static named(type_name) {
        if(this.coreTypes[type_name]) {
            return this.coreTypes[type_name]
        }
        if(!this.types[type_name]) {
            this.types[type_name] = new PHPSimpleType(type_name).union
        }
        return this.types[type_name]
    }
    /**
     * Builds the object
     * @param {string} type_name
     * @param {Object[]} [values]
     */
    constructor(type_name, values = []) {
        super()
        this.typeName = type_name
        this.values = values
    }
    /**
     * @type {string} A string representation of the type, as meaningful for type
     * checking.
     */
    get typeSignature() {
        return this.typeName
    }
    /**
     * Returns a type combining this with the other. The eventual values will
     * generally be a union.
     * @param {PHPSimpleType} other_type
     * @throws if the two object types are not identical
     * @returns {PHPSimpleType}
     */
    combineWith(other_type) {
        super.combineWith(other_type)
        if(this.values.length && other_type.values.length) {
            return new PHPSimpleType(
                this.typeName,
                this.values.concat(other_type.values)
            )
        } else if(this.values.length) {
            return other_type
        } else {
            return this
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
                case "boolean":
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
     * @returns {PHPSimpleType}
     */
    withValue(v) {
        if(this.values.length) {
            this.values.push(v)
            return this
        } else {
            return new PHPSimpleType(this.typeName, [v])
        }
    }
}

class PHPFunctionType extends PHPType {
    /**
     * 
     * @param {PHPTypeUnion[]} arg_types 
     * @param {PHPTypeUnion} return_type 
     * @param {{[x: number]: boolean}} [pass_by_reference_positions]
     * @param {{[x: number]: PHPTypeUnion}} [callback_positions]
     */
    constructor(arg_types, return_type, pass_by_reference_positions = {}, callback_positions = {}) {
        super()
        this.argTypes = arg_types
        this.passByReferencePositions = pass_by_reference_positions
        this.callbackPositions = callback_positions
        this.returnType = return_type
    }
    /**
     * @type {string} A string representation of the type, as meaningful for type
     * checking.
     */
    get typeSignature() {
        let args_composed = this.argTypes.map((arg, index) => {
            if(this.passByReferencePositions[index]) {
                return "&" + arg.typeSignature
            } else if(this.callbackPositions[index]) {
                return "*" + arg.typeSignature
            } else {
                return arg.typeSignature
            }
        })
        return `(${args_composed.join(", ")}) -> ${this.returnType}`
    }
    /**
     * Returns true if this function type and another are mutually compatible.
     * This doesn't mean that one is a valid subclass override of the other,
     * just that the input and output could be the same.
     *
     * Where the supplied type includes something and this does not, that's a
     * success. The reverse is a failure.
     *
     * @param {PHPFunctionType} expected_type The other function type
     * @returns {boolean}
     */
    compatibleWith(expected_type) {
        return (
            this.argTypes.length == expected_type.argTypes.length &&
            this.argTypes.every(
                (v, i) => v.compatibleWith(expected_type.argTypes[i])
            ) &&
            this.returnType.compatibleWith(expected_type.returnType)
        )
    }
    /**
     * @type {string} Represents best expression of the object, rather than
     * simply its type signature.
     */
    toString() {
        let args_composed = this.argTypes.map((arg, index) => {
            if(this.passByReferencePositions[index]) {
                return `&${arg}`
            } else if(this.callbackPositions[index]) {
                return `*${arg}`
            } else {
                return arg
            }
        })
        return `(${args_composed.join(", ")}) -> ${this.returnType}`
    }
}
class PHPTypeUnion {
    /**
     * An empty type union
     * @type {PHPTypeUnion}
     */
    static get empty() {
        return new PHPTypeUnion()
    }

    /**
     * A type union with a (...)->mixed function entry
     * @type {PHPTypeUnion}
     */
    static get mixedFunction() {
        return new PHPTypeUnion(
            new PHPFunctionType(
                [PHPSimpleType.coreTypes.mixed],
                PHPSimpleType.coreTypes.mixed
            )
        )
    }

    /**
     * @param {?PHPType} [initial_type]
     */
    constructor(initial_type = null) {
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
     * @type {PHPType[]}
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
     * Adds a type. Returns a derived type union which may not be the original.
     * @param {PHPType} type
     * @returns {PHPTypeUnion}
     */
    addType(type) {
        let merge_type = this.uniqueTypes[type.typeSignature]
        let new_type = merge_type ? merge_type.combineWith(type) : type
        if(merge_type && merge_type === new_type) {
            return this
        }
        if(this.types.length == 1) {
            let n = new PHPTypeUnion()
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
     * @param {PHPTypeUnion} union
     * @returns {PHPTypeUnion}
     */
    addTypesFrom(union) {
        if(this.types.length == 0) {
            return union
        } else if(this.types.length == 1) {
            let n = new PHPTypeUnion()
            n.uniqueTypes = Object.assign({}, this.uniqueTypes, union.uniqueTypes)
            return n
        } else {
            Object.keys(union.uniqueTypes).forEach(
                k => {
                    if(this.uniqueTypes[k]) {
                        let merge_type = this.uniqueTypes[k].combineWith(union.uniqueTypes[k])
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
     * Returns true if this type and another are mutually compatible.
     * This doesn't mean that one is a valid subclass override of the other,
     * just that they could be the same.
     *
     * Where the supplied type includes something and this does not, that's a
     * success. The reverse is a failure.
     *
     * @param {PHPTypeUnion} expected_type The other type
     * @returns {boolean}
     */
    compatibleWith(expected_type) {
        return (
            this === expected_type ||
            this === PHPSimpleType.coreTypes.mixed ||
            expected_type === PHPSimpleType.coreTypes.mixed ||
            this.types.every(
                t => expected_type.types.some(et => et.matches(t))
            )
        )
    }
    /**
     * @type {string} Represents best expression of the object, rather than
     * simply its type signature.
     */
    toString() {
        if(this.isEmpty) {
            return "null"
        } else {
            return this.types.join(" | ")
        }
    }
    /**
     * Adds a known value
     *
     * @param {string | number | boolean} v
     * @returns {PHPTypeUnion}
     */
    withValue(v) {
        if(this.types.length == 1) {
            let n = new PHPTypeUnion()
            n.uniqueTypes = {
                [this.types[0].typeSignature]: this.types[0].withValue(v),
            }
            return n
        } else {
            return this
        }
    }
}
export {PHPType, PHPFunctionType, PHPSimpleType, PHPTypeUnion}