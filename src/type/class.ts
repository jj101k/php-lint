import { Base } from "./base";
import { ClassInstance } from "./class-instance";
import { Function as _Function } from "./function";


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
}
export { _Class as Class };
