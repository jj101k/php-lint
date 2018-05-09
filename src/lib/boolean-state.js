import * as PHPType from "./php-type"
/**
 * Makes an assertion of some kind about a symbol
 */
class GeneralAssertion {
    /**
     *
     * @param {boolean} not
     * @param {string} symbol
     * @param {PHPType.Union} type
     */
    constructor(not, symbol, type) {
        this.not = not
        this.symbol = symbol
        this.type = type
    }
    get negative() {
        return new GeneralAssertion(!this.not, this.symbol, this.type)
    }
}

/**
 * This covers state mapping to a particular value (true or false). In other
 * words, if the current expression is true (or false), what does that mean
 * about the program state?
 */
class ValueState {
    /**
     *
     * @param {ValueState} a
     * @param {ValueState} b
     * @param {?boolean} value
     */
    static combine(a, b, value) {
        return new ValueState(
            a.value.addTypesFrom(b.value),
            a.assertions.concat(b.assertions)
        )
    }
    /**
     * Builds the object
     * @param {PHPType.Union} value
     * @param {GeneralAssertion[]} assertions
     */
    constructor(value, assertions) {
        this.assertions = assertions
        this.value = value
    }
}
/**
 * This covers state relating to boolean tests
 */
export default class BooleanState {
    /**
     *
     * @param {BooleanState} a
     * @param {BooleanState} b
     * @param {boolean} bool_value
     * @returns {BooleanState}
     */
    static and(a, b, bool_value) {
        let out = new BooleanState()
        a.trueStates.forEach(
            a_vs => b.trueStates.forEach(
                b_vs => out.trueStates.push(ValueState.combine(
                    a_vs,
                    b_vs,
                    bool_value ? true : null
                ))
            )
        )
        a.falseStates.forEach(
            a_vs => b.allStates.forEach(
                b_vs => out.falseStates.push(ValueState.combine(
                    a_vs,
                    b_vs,
                    bool_value ? false : null
                ))
            )
        )
        b.falseStates.forEach(
            b_vs => a.allStates.forEach(
                a_vs => out.falseStates.push(ValueState.combine(
                    a_vs,
                    b_vs,
                    bool_value ? false : null
                ))
            )
        )
        return out
    }
    /**
     *
     * @param {BooleanState} a
     * @param {BooleanState} b
     * @param {boolean} bool_value
     * @returns {BooleanState}
     */
    static or(a, b, bool_value) {
        let out = new BooleanState()
        a.falseStates.forEach(
            a_vs => b.falseStates.forEach(
                b_vs => out.falseStates.push(ValueState.combine(
                    a_vs,
                    b_vs,
                    bool_value ? false : null
                ))
            )
        )
        a.trueStates.forEach(
            a_vs => b.allStates.forEach(
                b_vs => out.trueStates.push(ValueState.combine(
                    a_vs,
                    b_vs,
                    bool_value ? true : null
                ))
            )
        )
        b.trueStates.forEach(
            b_vs => a.allStates.forEach(
                a_vs => out.trueStates.push(ValueState.combine(
                    a_vs,
                    b_vs,
                    bool_value ? true : null
                ))
            )
        )
        return out
    }
    /**
     * Builds the object
     */
    constructor() {
        /** @type {ValueState[]} */
        this.trueStates = []
        /** @type {ValueState[]} */
        this.falseStates = []
    }
    /**
     * @type {ValueState[]}
     */
    get allStates() {
        return this.trueStates.concat(this.falseStates)
    }
    get negative() {
        let bs = new BooleanState()
        bs.trueStates = this.falseStates
        bs.falseStates = this.trueStates
        return bs
    }
    /**
     *
     * @param {PHPType.Union} types
     * @param {GeneralAssertion} [assertion]
     * @param {GeneralAssertion} [inverse_assertion]
     */
    withType(types, assertion = null, inverse_assertion = null) {
        let false_type = PHPType.Union.empty
        let true_type = PHPType.Union.empty
        types.types.forEach(type => {
            let f = type.asFalse
            if(f) false_type.addType(f)
            let t = type.asTrue
            if(t) true_type.addType(t)
        })
        if(assertion) {
            this.trueStates.push(new ValueState(true_type, [assertion]))
            this.falseStates.push(new ValueState(
                false_type,
                [inverse_assertion || assertion.negative]
            ))
        } else {
            this.trueStates.push(new ValueState(true_type, []))
            this.falseStates.push(new ValueState(false_type, []))
        }
        return this
    }
}
export {GeneralAssertion as Assertion}