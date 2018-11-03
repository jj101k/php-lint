import { Base } from "./base";

/**
 * An integer
 */
export class Int extends Base {
    get shortType() {
        return "int"
    }
    public value: number | null
    constructor(value: number | null = null) {
        super()
        this.value = value
    }
}