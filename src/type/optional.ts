import * as Type from "../type";
import { Base } from "./base";
import { Null } from "./null";
import { Bool } from "./bool";

/**
 * A general PHP optional value
 */
export abstract class Optional extends Base {
    get combinePriority() {
        return -1
    }
    abstract get falseValue(): Base
    public content: Type.Base
    constructor(content: Type.Base) {
        super()
        this.content = content
    }
}

export class OptionalFalse extends Optional {
    get falseValue() {
        return new Bool(false)
    }
    get shortType() {
        return this.content.shortType + " | false"
    }
    protected combinedWithSpecific(type: Base): Base {
        if(type instanceof Type.Bool && type.value === false) {
            return this
        } else {
            return super.combinedWithSpecific(type)
        }
    }
}

export class OptionalNull extends Optional {
    get falseValue() {
        return new Null()
    }
    get shortType() {
        return this.content.shortType + " | null"
    }
    protected combinedWithSpecific(type: Base): Base {
        if(type instanceof Type.Null || type instanceof Type.Void) {
            return this
        } else {
            return super.combinedWithSpecific(type)
        }
    }
}