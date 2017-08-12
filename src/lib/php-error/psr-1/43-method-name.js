import _Error from "../error"
export default class S43MethodName extends _Error {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "PSR-1 #4.3 method names should be camelCase")
    }
}