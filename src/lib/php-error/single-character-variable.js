import _Error from "./error"
export default class SingleCharacterVariable extends _Error {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "Single-character variable with non-trivial type")
    }
}