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
    value
    constructor(value = null) {
        super()
        this.value = value
    }
    matches(type) {
        if(type instanceof Int || type instanceof Type.String) {
            return true
        } else {
            return super.matches(type)
        }
    }
}