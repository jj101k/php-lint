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
    /**
     * Returns the name for a ref, mostly of interest during debugging.
     *
     * @param ref Internal reference value
     * @returns eg. "\\Foo"
     */
    static className(ref: number): string {
        for(const [name, i] of this.refs.entries()) {
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

export class Mixed extends Base {
    get shortType() {
        return "mixed"
    }
    combinedWith(type: Base): Base {
        return this
    }
}