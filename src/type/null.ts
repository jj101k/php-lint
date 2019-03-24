import { Base, Mixed } from "./base";

/**
 * A null value
 */
export class Null extends Base {
    get shortType() {
        return "null"
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