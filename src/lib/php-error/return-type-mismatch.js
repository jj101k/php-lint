import _Error from "./error"
export default class ReturnTypeMismatch extends _Error {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "Practical return type does not match signature")
    }
}