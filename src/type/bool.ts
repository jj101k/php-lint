import { Base, Mixed } from "./base";

/**
 * A true/false value
 */
export class Bool extends Base {
    get shortType() {
        return "bool"
    }
    public value: boolean | null
    constructor(value: boolean | null = null) {
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