import _Node from "./node"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
import * as PHPType from "../php-type"
export default class Identifier extends _Node {
    /** @type {string} */
    get name() {
        return this.node.name;
    }
    /**
     * @type {string} eg. "fqn"
     */
    get resolution() {
        return this.node.resolution;
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        return new ContextTypes(
            context.findName(this.name) || new PHPType.Mixed().union
        )
    }
}
