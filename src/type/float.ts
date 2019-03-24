import { Base } from "./base";

/**
 * A floating-point number
 */
export class Float extends Base {
    get shortType() {
        return "float"
    }
    public value: number | null
    constructor(value: number | null = null) {
        super()
        this.value = value
    }
}