import { Base } from "./base";
import { OptionalNull } from "./optional";

/**
 * A null value
 */
export class Null extends Base {
    get combinePriority() {
        return -2
    }
    get shortType() {
        return "null"
    }
    combinedWithSpecific(type) {
        return new OptionalNull(type)
    }
}