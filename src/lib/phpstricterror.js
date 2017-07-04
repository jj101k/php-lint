import Context from "./context"
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
     * Builds the object
     * @param {string} message
     * @param {Context} context
     * @param {ParserLocation} location
     */
    constructor(message, context, location) {
        super(
            `${message} at ${context.fileContext.filename} line ${location.start.line}`
        )
        this.loc = location
    }
}
export default PHPStrictError