import * as Type from "../type";
import { Base } from "./base";
import { Null } from "./null";
import { Bool } from "./bool";

/**
 * A general PHP optional value
 */
export class Optional extends Base {
    get combinePriority() {
        return -1
    }
    get falseValue() {
        throw new Error("Not implemented")
    }

    content

    get types() {
        return [this.content, this.falseValue]
    }
    constructor(content) {
        super()
        this.content = content
    }

    /**
     * For types which have multiple expressions, returns true if *any* of them
     * match. In particular, if this is mixed it may match any type and if this
     * is optional it may match either.
     *
     * @param type
     */
    mayMatch(type) {
        return this.content.matches(type) || this.falseValue.matches(type)
    }
}

export class OptionalFalse extends Optional {
    get falseValue() {
        return new Bool(false)
    }
    get shortType() {
        return this.content.shortType + " | false"
    }
    combinedWithSpecific(type) {
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
    combinedWithSpecific(type) {
        if(type instanceof Type.Null || type instanceof Type.Void) {
            return this
        } else {
            return super.combinedWithSpecific(type)
        }
    }
}