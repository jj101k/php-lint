import { Base } from "./base";
import * as Type from "../../type"
import { Mixed } from "../inferred";

/**
 * A string of text
 */
export class String extends Base {
    get shortType() {
        return "string"
    }
    public value: string | null
    constructor(value: string | null = null) {
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
        if(type instanceof String) {
            return true
        } else {
            return super.matches(type)
        }
    }
}