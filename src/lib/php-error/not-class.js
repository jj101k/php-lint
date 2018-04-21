import _Error from "./error"
export default class NotClass extends _Error {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "Value is not a class instance")
    }
}