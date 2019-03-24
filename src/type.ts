/**
 * Some kind of type
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

    /**
     * Returns true if this matches the supplied type, ie if every possible
     * value of this is covered by at least one possible value of type.
     *
     * @param type
     */
    matches(type: Base): boolean {
        return type == this
    }
}