import { Base } from "./base";
import { OptionalFalse } from "./optional";

/**
 * A true/false value
 */
export class Bool extends Base {
    get asBoolean() {
        return this.value
    }
    get combinePriority() {
        return -4
    }
    get shortType() {
        return "bool"
    }
    public value: boolean | null
    constructor(value: boolean | null = null) {
        super()
        this.value = value
    }
    protected combinedWithSpecific(type: Base): Base {
        if(this.value === false) {
            return new OptionalFalse(type)
        } else {
            return super.combinedWithSpecific(type)
        }
    }
    toString() {
        if(this.value === null) {
            return super.toString()
        } else {
            return super.toString() + ` = ${this.value}`
        }
    }
}