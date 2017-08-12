import _Error from "./error"
export default class NoSuperclassParent extends _Error {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "Attempt to use parent:: with no superclass")
    }
}