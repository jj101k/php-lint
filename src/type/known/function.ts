import { Base } from "./base";
import * as Type from "../../type"

/**
 * An argument
 */
export class Argument {
    public byRef: boolean
    public hasDefaultValue: boolean
    public type: Base | null
    constructor(type: Base | null, by_ref: boolean = false, has_default_value: boolean = false) {
        this.byRef = by_ref
        this.hasDefaultValue = has_default_value
        this.type = type
    }
}

/**
 * A function
 */
export class Function extends Base {
    get shortType() {
        return "callable"
    }
    public args: Array<Argument>
    public returnType: Base | null
    constructor(args: Array<Argument>, returnType: Base | null = null) {
        super()
        this.args = args
        this.returnType = returnType
    }
    matches(type: Type.Base): boolean {
        if(type instanceof Function) {
            return true
        } else {
            return super.matches(type)
        }
    }
}