import { Base } from "./base";
import { Class as _Class } from "./class"

/**
 * A class or similar.
 */
export class ClassInstance extends Base {
    private of: _Class
    constructor(of: _Class) {
        super()
        this.of = of
    }
}