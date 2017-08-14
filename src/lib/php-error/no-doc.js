import _Error from "./error"
export default class NoDoc extends _Error {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "No documentation for class/method")
    }
}