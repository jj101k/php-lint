import * as Type from "../type";
import { Base } from "./base";

/**
 * A string of text
 */
export class String extends Base {
    get combinePriority() {
        return -Infinity
    }
    get shortType() {
        return "string"
    }
    public value: string | null
    constructor(value: string | null = null) {
        super()
        this.value = value
    }
    matches(type: Type.Base): boolean {
        if(type instanceof String) {
            return true
        } else {
            return super.matches(type)
        }
    }
}