class PHPType {
    /**
     * A new PHPTypeUnion containing this.
     * @returns {PHPTypeUnion}
     */
    get union() {
        return new PHPTypeUnion(this)
    }
    toString() {
        return "mixed"
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
     */
    constructor(type_name) {
        super()
        this.typeName = type_name
    }
    toString() {
        return this.typeName
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
     * Adds a type. Returns a derived type union which may not be the original.
     * @param {PHPType} type
     * @returns {PHPTypeUnion}
     */
    addType(type) {
        if(this.types.length == 1) {
            let n = new PHPTypeUnion()
            n.uniqueTypes = Object.assign(
                {
                    ["" + type]: type,
                },
                this.uniqueTypes
            )
            return n
        } else {
            this.uniqueTypes["" + type] = type
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
            Object.assign(this.uniqueTypes, union.uniqueTypes)
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
                t => expected_type.types.some(et => et === t)
            )
        )
    }
    toString() {
        if(this.isEmpty) {
            return "null"
        } else {
            return this.types.join(" | ")
        }
    }
}
export {PHPType, PHPFunctionType, PHPSimpleType, PHPTypeUnion}