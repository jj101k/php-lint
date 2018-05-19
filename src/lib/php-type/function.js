import _Any from "./any"
import _Core from "./core"
import _Mixed from "./mixed"
import _Union from "./union"
/**
 * A function/closure
 */
export default class _Function extends _Any {
    /**
     * A (...)->mixed function entry
     * @type {_Function}
     */
    static get mixed() {
        return new _Function(
            [new _Mixed(null, null, "~function#in").union],
            new _Mixed(null, null, "~function#out").union
        )
    }
    /**
     *
     * @param {_Union[]} arg_types
     * @param {?_Union} return_type
     * @param {{[x: number]: boolean}} [pass_by_reference_positions]
     * @param {{[x: number]: _Union}} [callback_positions]
     */
    constructor(
        arg_types,
        return_type,
        pass_by_reference_positions = {},
        callback_positions = {}
    ) {
        super()
        this.argTypes = arg_types
        this.passByReferencePositions = pass_by_reference_positions
        this.callbackPositions = callback_positions
        this.returnType = return_type || _Core.types.void
    }
    /**
     * @type {?this}
     */
    get asFalse() {
        return null
    }
    /**
     * @type {?this}
     */
    get asTrue() {
        return this
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
     * Returns true if this function type does not violate the behaviours
     * expected by another function type.
     *
     * In other words, all the arguments defined by the other function must be
     * accepted by this type, and the return type defined here must be accepted
     * by the other type.
     *
     * (int) -> void complies with () -> void
     *
     * () -> int complies with () -> mixed
     *
     * @param {_Function} expected_type The other function type
     * @param {(string) => string[]} resolver
     * @returns {boolean}
     */
    compliesWith(expected_type, resolver) {
        if(expected_type instanceof _Function) {
            if(this.argTypes.length < expected_type.argTypes.length) return false
            let generic_arg_types = {}
            for(let i in expected_type.argTypes) {
                let expected = expected_type.argTypes[i]
                let arg = this.argTypes[i]
                if(expected.compliesWith(arg, resolver)) {
                    if(arg.isMixed && !expected.isMixed) {
                        generic_arg_types["" + arg] = expected
                    }
                } else {
                    return false
                }
            }
            if(this.returnType.isMixed) {
                let test_type = _Union.empty
                this.returnType.types.forEach(t => {
                    if(generic_arg_types["" + t]) {
                        test_type = test_type.addTypesFrom(generic_arg_types["" + t])
                    } else {
                        test_type = test_type.addType(t)
                    }
                })
                return test_type.compliesWith(expected_type.returnType, resolver)
            } else {
                return this.returnType.compliesWith(expected_type.returnType, resolver)
            }
        } else {
            return false
        }
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