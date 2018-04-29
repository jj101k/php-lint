import _Error from "./error"
export default class MultitypeBadObject extends _Error {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "One or more types for a value cannot be used as an object")
    }
}