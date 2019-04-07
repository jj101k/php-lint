import * as Type from "../type";
import { Base } from "./base";

/**
 * An integer
 */
export class Int extends Base {
    get combinePriority() {
        return -Infinity
    }
    get shortType() {
        return "int"
    }
    public value: number | null
    constructor(value: number | null = null) {
        super()
        this.value = value
    }
    matches(type: Type.Base): boolean {
        if(type instanceof Int || type instanceof Type.String) {
            return true
        } else {
            return super.matches(type)
        }
    }
}