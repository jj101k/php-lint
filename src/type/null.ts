import { Base } from "./base";

/**
 * A null value
 */
export class Null extends Base {
    get shortType() {
        return "null"
    }
}