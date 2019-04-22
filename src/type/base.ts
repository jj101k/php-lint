/**
 * A type which you can be certain about
 */
export abstract class Base {
    /**
     * If this value is definitely or false, returns those values; otherwise null
     */
    get asBoolean(): boolean | null {
        return null
    }
    /**
     * Returns a type which is abstract enough to express this type and the
     * other, where this type is known to be as or less specific than the other
     * type.
     *
     * This is what runs after ordering and trivial type merging has been attempted.
     *
     * @param type
     */
    protected combinedWithSpecific(type: Base): Base {
        return new Mixed()
    }

    /**
     * Returns the priority for combination, so that types which have a clearer
     * combination mode will dictate what happens. Higher number is higher
     * priority.
     */
    abstract get combinePriority(): number

    /**
     * Returns the instance counterpart of the type. Only defined for class-like
     * structures.
     */
    get instanceType(): Base {
        return this
    }

    /**
     * The type signature usable in PHP function declarations
     */
    abstract get shortType(): string

    /**
     * Returns the possible types that this expresses, for multi-type values.
     */
    public get types(): Base[] {
        return [this]
    }

    /**
     * Returns a type which is abstract enough to express this type and the other.
     *
     * @param type
     */
    combinedWith(type: Base): Base {
        if(this.combinePriority < type.combinePriority) {
            return type.combinedWith(this)
        } else if(type.matches(this)) {
            return this
        } else if(this.matches(type)) {
            return type
        } else {
            return this.combinedWithSpecific(type)
        }
    }

    /**
     * Returns true if this type is a subset of the supplied type.
     *
     * @param type
     */
    matches(type: Base): boolean {
        if(type instanceof Mixed) {
            return true
        } else {
            const types = type.types
            if(types.length > 1) {
                return this.types.every(
                    tt => types.some(t => tt.matches(t))
                )
            } else {
                return type.constructor === this.constructor
            }
        }
    }

    /**
     * For types which have multiple expressions, returns true if *any* of them
     * match. In particular, if this is mixed it may match any type and if this
     * is optional it may match either.
     *
     * @param type
     */
    mayMatch(type: Base): boolean {
        return this.matches(type)
    }

    /**
     * This should express enough info to clearly identify mismatching types
     */
    toString() {
        return `${this.shortType} (${this.constructor.name})`
    }
}
/**
 * The catch-all "any type" type
 */
export class Mixed extends Base {
    get combinePriority() {
        return 0
    }
    get shortType() {
        return "mixed"
    }
    protected combinedWithSpecific(type: Base): Base {
        return this
    }

    /**
     * For types which have multiple expressions, returns true if *any* of them
     * match. In particular, if this is mixed it may match any type and if this
     * is optional it may match either.
     *
     * @param type
     */
    mayMatch(type: Base): boolean {
        return true
    }
}