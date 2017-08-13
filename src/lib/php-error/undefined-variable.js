import _Error from "./error"
export default class UndefinedVariable extends _Error {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "Name is not defined in this namespace")
    }
}