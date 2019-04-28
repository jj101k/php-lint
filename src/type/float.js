import { Base } from "./base";

/**
 * A floating-point number
 */
export class Float extends Base {
    get combinePriority() {
        return -Infinity
    }
    get shortType() {
        return "float"
    }
    value
    constructor(value = null) {
        super()
        this.value = value
    }
}