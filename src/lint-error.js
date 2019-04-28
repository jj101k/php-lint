/**
 * A problem in the code
 */
export class LintError extends Error {
    /**
     *
     * @param message
     * @param node
     */
    constructor(message, node) {
        if(node.loc) {
            super(`Line ${node.loc.start.line} column ${node.loc.start.column}: ${message}`)
        } else {
            super(message)
        }
    }
}