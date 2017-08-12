import Context from "../context"
import PHPStrictError from "../php-strict-error"
import _Node from "../shadowtree/node"

export default class _Error extends Error {
    /**
     * Contextualises the error
     * @param {Context} context
     * @param {_Node} node
     * @returns {PHPStrictError}
     */
    withContext(context, node) {
        return new PHPStrictError(this.message, context, node)
    }
}