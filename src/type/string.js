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
    value
    constructor(value = null) {
        super()
        this.value = value
    }
    matches(type) {
        if(type instanceof String) {
            return true
        } else {
            return super.matches(type)
        }
    }
}