import { Base } from "./base";
import { Mixed } from "../inferred";

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
    combinedWith(type: Base): Base {
        if(type.matches(this)) {
            return this
        } else if(this.matches(type)) {
            return type
        } else {
            return new Mixed()
        }
    }
}