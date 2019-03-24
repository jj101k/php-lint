import * as Type from "../type";
import { Base } from "./base";

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
}

export class OptionalNull extends Optional {
    get shortType() {
        return this.content.shortType + " | null"
    }
}