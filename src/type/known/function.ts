import { Known } from "../known";

export class Argument {
    public byRef: boolean
    public type: Known | null
    constructor(type: Known | null, by_ref = false) {
        this.byRef = by_ref
        this.type = type
    }
}

export class Function extends Known {
    public args: Array<Argument>
    public returnType: Known | null
    constructor(args: Array<Argument>, returnType: Known | null = null) {
        super()
        this.args = args
        this.returnType = returnType
    }
}