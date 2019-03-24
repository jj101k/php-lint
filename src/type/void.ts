import { Base, Mixed } from "./base";

/**
 * No value
 */
export class Void extends Base {
    get shortType() {
        return "void"
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