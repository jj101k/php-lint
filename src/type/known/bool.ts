import { Base } from "./base";

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
}