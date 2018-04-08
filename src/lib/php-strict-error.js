import Context from "./context"
import _Node from "./shadowtree/node"

class PHPStrictError extends Error {
    /**
     * Just issues a structured warning.
     *
     * @param {string} message
     * @param {Context} context
     * @param {_Node} node
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
     * @param {_Node} node
     */
    constructor(message, context, node) {
        super(
            `${message} at ${context.fileContext.filename} line ${node.loc.start.line}`
        )
        this.loc = node.loc
        this.filename = context.fileContext.filename
    }
}
export default PHPStrictError