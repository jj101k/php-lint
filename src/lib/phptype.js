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

class PHPSimpleType extends PHPType {
    /** @type {{[x: string]: PHPTypeUnion}} */
    static get types() {
        if(!this._types) {
            this._types = {
                array: new PHPSimpleType("array").union,
                boolean: new PHPSimpleType("boolean").union,
                null: new PHPSimpleType("null").union,
                number: new PHPSimpleType("number").union,
                self: new PHPSimpleType("self").union,
                string: new PHPSimpleType("string").union,
            }
        }
        return this._types
    }
    /**
     * Returns a cached type by name
     * @param {string} type_name
     * @returns {PHPTypeUnion}
     */
    static named(type_name) {
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
     * A type union with an undefined entry.
     * @type {PHPTypeUnion}
     */
    static get mixed() {
        return PHPSimpleType.named("mixed")
    }

    /**
     * A type union with a (...)->mixed function entry
     * @type {PHPTypeUnion}
     */
    static get mixedFunction() {
        return new PHPTypeUnion(
            new PHPFunctionType(
                [PHPTypeUnion.mixed],
                PHPTypeUnion.mixed
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
    toString() {
        if(this.isEmpty) {
            return "null"
        } else {
            return this.types.join(" | ")
        }
    }
}
export {PHPType, PHPFunctionType, PHPSimpleType, PHPTypeUnion}