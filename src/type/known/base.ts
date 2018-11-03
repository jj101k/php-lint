import * as Type from "../../type"
import * as Inferred from "../inferred"
/**
 * A type which you can be certain about
 */
export abstract class Base extends Type.Base {
    matches(type: Base): boolean {
        if(type instanceof Inferred.Mixed) {
            return true
        } else {
            return super.matches(type)
        }
    }
}