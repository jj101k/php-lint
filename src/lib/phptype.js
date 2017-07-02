class PHPType {
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
}

class PHPFunctionType extends PHPType {
    /**
     * 
     * @param {PHPType[]} arg_types 
     * @param {string[]} return_type 
     */
    constructor(arg_types, return_type) {
        super()
        this.argTypes = arg_types
        this.returnType = return_type
    }
}
export {PHPType, PHPFunctionType, PHPSimpleType}