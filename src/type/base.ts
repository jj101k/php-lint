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
    combinedWith(type: Base): Base {
        if(type.matches(this)) {
            return this
        } else if(this.matches(type)) {
            return type
        } else {
            return new Mixed()
        }
    }

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