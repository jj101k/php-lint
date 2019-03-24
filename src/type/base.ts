/**
 * A type which you can be certain about
 */
export abstract class Base {
    /**
     * The type signature usable in PHP function declarations
     */
    abstract get shortType(): string

    /**
     * Returns a type which is abstract enough to express this type and the other.
     *
     * @param type
     */
    abstract combinedWith(type: Base): Base

    matches(type: Base): boolean {
        if(type instanceof Mixed) {
            return true
        } else {
            return type == this
        }
    }
}
/**
 * The catch-all "any type" type
 */
export class Mixed extends Base {
    get shortType() {
        return "mixed"
    }
    combinedWith(type: Base): Base {
        return this
    }
}