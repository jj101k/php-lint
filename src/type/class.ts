import { Base } from "./base";
import { ClassInstance } from "./class-instance";
import { Function as _Function } from "./function";

/**
 * A class!
 */
class _Class extends Base {
    get combinePriority() {
        return -Infinity
    }
    get shortType() {
        return ClassInstance.className(this.ref)
    }
    public classMethods: Map<string, _Function> = new Map()
    public methods: Map<string, _Function> = new Map()
    public ref: number
    constructor(name: string) {
        super()
        this.ref = ClassInstance.classRef(name)
    }
}
/**
 * A trait
 */
class Trait extends Base {
    get combinePriority(): number {
        throw new Error("Cannot combine traits")
    }
    get shortType() {
        return "trait" // Not actually usable in any meaningful sense
    }
    public classMethods: Map<string, _Function> = new Map()
    public methods: Map<string, _Function> = new Map()
    constructor(name: string) {
        super()
    }
}
export { _Class as Class, Trait };
