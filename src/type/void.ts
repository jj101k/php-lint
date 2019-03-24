import { Base } from "./base";
import { OptionalNull } from "./optional";

/**
 * No value
 */
export class Void extends Base {
    get combinePriority() {
        return -3
    }
    get shortType() {
        return "void"
    }
    protected combinedWithSpecific(type: Base): Base {
        return new OptionalNull(type)
    }
}