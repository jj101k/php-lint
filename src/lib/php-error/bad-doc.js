import _Error from "./error"
export default class BadDoc extends _Error {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "Inaccurate documentation for class/method")
    }
}