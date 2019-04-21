import * as Type from "../type";
import { Base } from "./base";

/**
 * A "resource", normally mapping to an OS-level file descriptor or similar.
 */
export class Resource extends Base {
    get combinePriority() {
        return -Infinity
    }
    get shortType() {
        return "resource"
    }
    matches(type: Type.Base): boolean {
        if(type instanceof Resource) {
            return true
        } else {
            return super.matches(type)
        }
    }
}