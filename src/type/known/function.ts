import { Base } from "./base";

/**
 * An argument
 */
export class Argument {
    public byRef: boolean
    public type: Base | null
    constructor(type: Base | null, by_ref = false) {
        this.byRef = by_ref
        this.type = type
    }
}

/**
 * A function
 */
export class Function extends Base {
    public args: Array<Argument>
    public returnType: Base | null
    constructor(args: Array<Argument>, returnType: Base | null = null) {
        super()
        this.args = args
        this.returnType = returnType
    }
}