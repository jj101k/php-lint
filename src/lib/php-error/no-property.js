import _Error from "./error"
export default class NoProperty extends _Error {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "No such accessible identifier")
    }
}