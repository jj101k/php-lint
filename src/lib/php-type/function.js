import _Any from "./any"
import _Core from "./core"
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
            [_Core.types.mixed],
            _Core.types.mixed
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
     * For arguments, this supplied types must be a subset of this. For return
     * values, this must be a subset of the supplied type. In other words, the
     * supplied function type must describe ALL supported outputs and SOME
     * supported inputs.
     *
     * @param {_Function} expected_type The other function type
     * @returns {boolean}
     */
    compatibleWith(expected_type) {
        if(expected_type instanceof _Function) {
            return (
                this.argTypes.length == expected_type.argTypes.length &&
                expected_type.argTypes.every(
                    (v, i) => v.compatibleWith(this.argTypes[i])
                ) &&
                this.returnType.compatibleWith(expected_type.returnType)
            )
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