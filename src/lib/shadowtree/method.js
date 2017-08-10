import Context from "../context"
import ContextTypes from "../context-types"
import _Function from "./function"
import PHPStrictError from "../php-strict-error"
export default class Method extends _Function {
    /** @type {boolean} */
    get isAbstract() {
        return this.node.isAbstract
    }
    /** @type {boolean} */
    get isFinal() {
        return this.node.isFinal
    }
    /** @type {boolean} */
    get isStatic() {
        return this.node.isStatic
    }
    /** @type {string} */
    get visibility() {
        return this.node.visibility
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        if(!this.name.match(/^[0-9a-z]+([0-9A-Z]+[0-9a-z]*)*$/)) {
            // This does allow names like getUPSPowerState
            throw new PHPStrictError(
                `PSR-1 #4.3 method names should be camelCase`,
                context,
                this.loc
            )
        }
        let method_type = super.check(context).expressionType
        context.classContext.addIdentifier(
            this.name,
            this.visibility,
            this.isStatic,
            method_type
        )

        return ContextTypes.empty
    }
}
