import { Base } from "./base";
import { Class as _Class } from "./class"
import * as Type from "../../type"
import * as Inferred from "../../type/inferred"

/**
 * A class or similar.
 */
export class ClassInstance extends Base {
    private classRef: number
    constructor(class_ref: number) {
        super()
        this.classRef = class_ref
    }
    get shortType() {
        return Inferred.ClassInstance.className(this.classRef)
    }
    combinedWith(type: Base): Base {
        if(type.matches(this)) {
            return this
        } else if(this.matches(type)) {
            return type
        } else {
            return new Inferred.Mixed()
        }
    }
    matches(type: Type.Base): boolean {
        if(type instanceof Inferred.ClassInstance) {
            return type.classRef == this.classRef
        } else if(type instanceof ClassInstance) {
            return type.classRef == this.classRef
        } else if(type instanceof _Class) {
            return type.ref == this.classRef
        } else {
            return super.matches(type)
        }
    }
}