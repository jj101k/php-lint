import Context from "./context"
import AbstractNode from "./shadowtree/abstract-node"

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

class PHPStrictError extends Error {
    /**
     * Just issues a structured warning.
     *
     * @param {string} message
     * @param {Context} context
     * @param {AbstractNode} node
     */
    static warn(message, context, node) {
        console.log(
            "Warning: " +
            new PHPStrictError(message, context, node).message
        )
    }

    /**
     * Builds the object
     * @param {string} message
     * @param {Context} context
     * @param {AbstractNode} node
     * @param {?ParserLocation} [effective_location]
     */
    constructor(message, context, node, effective_location = null) {
        super(
            `${message} at ${context.fileContext.filename} line ${node.loc.start.line}`
        )
        this.loc = effective_location || node.loc
        this.filename = context.fileContext.filename
    }
}
export default PHPStrictError