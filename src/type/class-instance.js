import { Base } from "./base";
import { Class as _Class } from "./class";
import { String as _String} from "./string"

/**
 * A class or similar.
 */
export class ClassInstance extends Base {
    static #lastRef = 0
    static #refs = new Map()
    /**
     * Returns the name for a ref, mostly of interest during debugging.
     *
     * @param ref Internal reference value
     * @returns eg. "\\Foo"
     */
    static className(ref) {
        for(const [name, i] of this.#refs.entries()) {
            if(+i == ref) return name
        }
        throw new Error(`Unrecognised ref: ${ref}`)
    }
    /**
     * Gets the internal reference value for a class or similar (interface). If
     * it does not already exist, it will be added. This does not create any
     * objects for it.
     *
     * @param name eg. "\\Foo"
     * @returns Internal reference value
     */
    static classRef(name) {
        if(!this.#refs.get(name)) {
            this.#lastRef++
            this.#refs.set(name, this.#lastRef)
        }
        return this.#refs.get(name)
    }

    #classRef
    get combinePriority() {
        return -Infinity
    }
    constructor(class_ref) {
        super()
        this.#classRef = class_ref
    }
    get shortType() {
        return ClassInstance.className(this.#classRef)
    }
    matches(type) {
        if(type instanceof ClassInstance) {
            return type.#classRef == this.#classRef
        } else if(type instanceof ClassInstance) {
            return type.#classRef == this.#classRef
        } else if(type instanceof _Class) {
            return type.ref == this.#classRef
        } else if(type instanceof _String) {
            const c = _Class.byRef(this.#classRef)
            return c ? c.hasMethod("__toString") : false
        } else {
            return super.matches(type)
        }
    }
}