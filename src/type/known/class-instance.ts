import { Base } from "./base";
import { Class as _Class } from "./class"

/**
 * A class or similar.
 */
export class ClassInstance extends Base {
    private classRef: number
    constructor(class_ref: number) {
        super()
        this.classRef = class_ref
    }
}