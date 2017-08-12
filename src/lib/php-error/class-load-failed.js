import _Error from "./error"
export default class ClassLoadFailed extends _Error {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "Class load failed")
    }
}