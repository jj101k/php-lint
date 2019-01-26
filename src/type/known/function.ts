import { Base } from "./base";
import * as Type from "../../type"

/**
 * An argument spec for a function.
 */
export class Argument {
    public byRef: boolean
    public hasDefaultValue: boolean
    public type: Base | null
    /**
     *
     * @param type The type the arg is required to have, if any.
     * @param by_ref True for PBR values. Here, the passed in value is in effect
     * a preallocated pointer, which might not have been declared in advance.
     * @param has_default_value True if there is a default, which affects the
     * valid argument subsets which can be used, and, in the special case where
     * the default is null, may also affect the accepted types.
     */
    constructor(
        type: Base | null,
        by_ref: boolean = false,
        has_default_value: boolean = false
    ) {
        this.byRef = by_ref
        this.hasDefaultValue = has_default_value
        this.type = type
    }
}

/**
 * A function declaration
 */
class _Function extends Base {
    get shortType() {
        return "callable"
    }
    public args: Array<Argument>
    public returnType: Base | null
    /**
     *
     * @param args The arguments supported
     * @param returnType The return type, if there is one. Null here isn't for
     * non-returning functions but rather for functions with a completely
     * undetermined return type.
     */
    constructor(args: Array<Argument>, returnType: Base | null = null) {
        super()
        this.args = args
        this.returnType = returnType
    }
    matches(type: Type.Base): boolean {
        if(type instanceof _Function) {
            return true
        } else {
            return super.matches(type)
        }
    }
}

export {_Function as Function}