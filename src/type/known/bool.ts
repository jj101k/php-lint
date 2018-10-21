import { Base } from "./base";

/**
 * A true/false value
 */
export class Bool extends Base {
    public value: boolean | null
    constructor(value: boolean | null = null) {
        super()
        this.value = value
    }
}