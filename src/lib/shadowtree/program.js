import Context from "../context"
import ContextTypes from "../context-types"
import Block from "./block"
import Class from "./class"
import * as PHPError from "../php-error"
export default class Program extends Block {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        let classes = this.children.filter(
            c => c instanceof Class
        )
        if(classes.length > 1) {
            this.throw(new PHPError.PSR1.S3ClassCount(
                `PSR-1 #3: One class per file (${classes.length})`
            ), context)
        }
        var inner_context = context.childContext()
        this.children.forEach(child => child.check(inner_context))
        return super.check(context)
    }
}
