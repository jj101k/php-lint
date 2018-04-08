import Context from "../context"
import PHPStrictError from "../php-strict-error"
import _Node from "../shadowtree/node"

/**
 * @typedef ParserPosition
 * @property {number} line
 * @property {number} column
 * @property {number} offset
 */
/**
 * @typedef ParserLocation
 * @property {?string} source
 * @property {ParserPosition} start
 * @property {ParserPosition} end
 */

export default class _Error extends Error {
    /**
     * Contextualises the error
     * @param {Context} context
     * @param {_Node} node
     * @param {?ParserLocation} [effective_location]
     * @returns {PHPStrictError}
     */
    withContext(context, node, effective_location = null) {
        return new PHPStrictError(this.message, context, node, effective_location)
    }
}