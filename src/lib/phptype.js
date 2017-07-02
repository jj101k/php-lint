class PHPType {
    toString() {
        return "mixed"
    }
}

class PHPSimpleType extends PHPType {
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
     */
    constructor(arg_types, return_type) {
        super()
        this.argTypes = arg_types
        this.returnType = return_type
    }
    toString() {
        return `(${this.argTypes.join(", ")}) -> ${this.returnType}`
    }
}
class PHPTypeUnion {
    /**
     *
     */
    constructor() {
        this.uniqueTypes = {}
    }
    /**
     * @type {PHPType[]}
     */
    get types() {
        return Object.values(this.uniqueTypes)
    }
    /**
     *
     * @param {PHPType} type
     */
    addType(type) {
        this.uniqueTypes["" + type] = type
    }
    /**
     *
     * @param {PHPTypeUnion} union
     */
    addTypesFrom(union) {
        for(var k in union.uniqueTypes) {
            this.uniqueTypes[k] = union.uniqueTypes[k]
        }
    }
    toString() {
        if(this.types.length) {
            return this.types.join(" | ")
        } else {
            return "null"
        }
    }
}
export {PHPType, PHPFunctionType, PHPSimpleType, PHPTypeUnion}