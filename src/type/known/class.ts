import { Base } from "./base";
import { ClassInstance } from "../inferred";

/**
 * A class or similar.
 */
class _Class extends Base {
    public ref: number
    constructor(name: string) {
        super()
        this.ref = ClassInstance.classRef(name)
    }
}
export {_Class as Class}