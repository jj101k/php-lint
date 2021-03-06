import _Error from "./error"
export default class BadTypeCast extends _Error {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "Possibly bad cast")
    }
}