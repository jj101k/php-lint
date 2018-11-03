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
    public classRef: number
    constructor(class_ref: number) {
        super()
        this.classRef = class_ref
    }
}

export class Mixed extends Base {
}