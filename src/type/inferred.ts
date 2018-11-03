import * as Type from "../type"
/**
 * A type which you assume exists
 */
export abstract class Base extends Type.Base {
    matches(type: Base): boolean {
        if(type instanceof Mixed) {
            return true
        } else {
            return super.matches(type)
        }
    }
}

/**
 * A class or similar.
 */
export class ClassInstance extends Base {
    private static lastRef: number = 0
    private static refs: Map<string, number> = new Map()
    static className(ref: number): string {
        for(const [name, i] of this.refs.entries()) {
            if(+i == ref) return name
        }
        throw new Error(`Unrecognised ref: ${ref}`)
    }
    static classRef(name: string): number {
        if(!this.refs.get(name)) {
            this.lastRef++
            this.refs.set(name, this.lastRef)
        }
        return this.refs.get(name)!
    }
    get shortType() {
        return ClassInstance.className(this.classRef)
    }
    public classRef: number
    constructor(class_ref: number) {
        super()
        this.classRef = class_ref
    }
}

export class Mixed extends Base {
    get shortType() {
        return "mixed"
    }
}