import { Base } from "./base";

/**
 * A class or similar.
 */
class _Class extends Base {
    private static lastRef: number = 0
    public static refs: Map<string, number> = new Map()
    static classRef(name: string): number {
        if(!this.refs.get(name)) {
            this.lastRef++
            this.refs.set(name, this.lastRef)
        }
        return this.refs.get(name)!
    }
    public ref: number
    constructor(name: string) {
        super()
        this.ref = _Class.classRef(name)
    }
}
export {_Class as Class}