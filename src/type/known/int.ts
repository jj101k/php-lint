import { Base } from "./base";

/**
 * An integer
 */
export class Int extends Base {
    public value: number | null
    constructor(value: number | null = null) {
        super()
        this.value = value
    }
}