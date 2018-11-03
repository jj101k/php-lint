import * as Type from "../type"
/**
 * A type which you assume exists
 */
export abstract class Base extends Type.Base {
}

/**
 * A class or similar.
 */
export class ClassInstance extends Base {
    private static lastRef: number = 0
    private static refs: Map<string, number> = new Map()
    static classRef(name: string): number {
        if(!this.refs.get(name)) {
            this.lastRef++
            this.refs.set(name, this.lastRef)
        }
        return this.refs.get(name)!
    }
    public classRef: number
    constructor(class_ref: number) {
        super()
        this.classRef = class_ref
    }
}

export class Mixed extends Base {
}