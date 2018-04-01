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
     * @param {parserStateOptions} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = {}, doc = null) {
        let classes = this.children.filter(
            c => c instanceof Class
        )
        if(classes.length > 1) {
            this.throw(new PHPError.PSR1.S3ClassCount(
                `PSR-1 #3: One class per file (${classes.length})`
            ), context)
        }
        return super.check(context, parser_state, doc)
    }
}
