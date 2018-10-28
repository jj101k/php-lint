import * as Type from "../type"
/**
 * A type which you assume exists
 */
export class Base extends Type.Base {
}

/**
 * A class or similar.
 */
export class ClassInstance extends Base {
    public name: string
    constructor(name: string) {
        super()
        this.name = name
    }
}