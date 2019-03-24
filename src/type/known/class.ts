import { Base } from "./base";
import { ClassInstance, Mixed } from "../inferred";

import {Function as _Function} from "./function"

/**
 * A class or similar.
 */
class _Class extends Base {
    get shortType() {
        return ClassInstance.className(this.ref)
    }
    public methods: Map<string, _Function> = new Map()
    public ref: number
    constructor(name: string) {
        super()
        this.ref = ClassInstance.classRef(name)
    }
    combinedWith(type: Base): Base {
        if(type.matches(this)) {
            return this
        } else if(this.matches(type)) {
            return type
        } else {
            return new Mixed()
        }
    }
}
export {_Class as Class}