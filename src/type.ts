/**
 * Some kind of type
 */
export class Base {
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