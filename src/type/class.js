import { Base } from "./base";
import { ClassInstance } from "./class-instance";
import { Function as _Function } from "./function";

/**
 * A class!
 */
class _Class extends Base {
    static #_byRef = new Map()
    static byRef(ref) {
        return this.#_byRef.get(ref)
    }
    get combinePriority() {
        return -Infinity
    }
    /**
     * Returns the instance counterpart of the type. Only defined for class-like
     * structures.
     */
    get instanceType() {
        return new ClassInstance(this.ref)
    }
    get shortType() {
        return ClassInstance.className(this.ref)
    }
    classMethods = new Map()
    methods = new Map()
    parent = null
    ref
    constructor(name) {
        super()
        this.ref = ClassInstance.classRef(name)
        _Class.#_byRef.set(this.ref, this)
    }

    hasMethod(name) {
        return this.methods.has(name) || (this.parent && this.parent.hasMethod(name)) || false
    }
}
/**
 * A trait
 */
class Trait extends Base {
    get combinePriority() {
        throw new Error("Cannot combine traits")
    }
    get shortType() {
        return "trait" // Not actually usable in any meaningful sense
    }
    classMethods = new Map()
    methods = new Map()
    constructor(name) {
        super()
    }
}
export { _Class as Class, Trait };
