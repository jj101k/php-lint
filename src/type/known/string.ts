import { Base } from "./base";

/**
 * A string of text
 */
export class String extends Base {
    get shortType() {
        return "string"
    }
    public value: string | null
    constructor(value: string | null = null) {
        super()
        this.value = value
    }
}