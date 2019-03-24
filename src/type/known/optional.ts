import * as Type from "../../type"
import { Base } from "./base";
import { Mixed } from "../inferred";

/**
 * A general PHP optional value
 */
export abstract class Optional extends Base {
    public content: Type.Base
    constructor(content: Type.Base) {
        super()
        this.content = content
    }
}

export class OptionalFalse extends Optional {
    get shortType() {
        return this.content.shortType + " | false"
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

export class OptionalNull extends Optional {
    get shortType() {
        return this.content.shortType + " | null"
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