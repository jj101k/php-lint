import { Base } from "./base";

/**
 * A string of text
 */
export class String extends Base {
    public value: string | null
    constructor(value: string | null = null) {
        super()
        this.value = value
    }
}