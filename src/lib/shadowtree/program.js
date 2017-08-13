import Context from "../context"
import ContextTypes from "../context-types"
import Block from "./block"
import Class from "./class"
import Doc from "./doc"
import * as PHPError from "../php-error"
export default class Program extends Block {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {boolean} [in_call]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false, doc = null) {
        let classes = this.children.filter(
            c => c instanceof Class
        )
        if(classes.length > 1) {
            this.throw(new PHPError.PSR1.S3ClassCount(
                `PSR-1 #3: One class per file (${classes.length})`
            ), context)
        }
        var inner_context = context.childContext()
        /** @type {?Doc} */
        let last_doc = null
        this.children.forEach(child => {
            if(child instanceof Doc) {
                last_doc = child
            } else {
                child.check(inner_context, false, last_doc)
                last_doc = null
            }
        })
        return super.check(context, in_call, doc)
    }
}
