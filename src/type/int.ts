import { Base, Mixed } from "./base";
import * as Type from "../type"

/**
 * An integer
 */
export class Int extends Base {
    get shortType() {
        return "int"
    }
    public value: number | null
    constructor(value: number | null = null) {
        super()
        this.value = value
    }
    combinedWith(type: Base): Base {
        if(type.matches(this)) {
            return this
        } else if(this.matches(type)) {
            return type
        } else {
            return new Mixed()
        }
    }
    matches(type: Type.Base): boolean {
        if(type instanceof Int) {
            return true
        } else {
            return super.matches(type)
        }
    }
}