import _Error from "./error"
export default class Goto extends _Error {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "Use of goto")
    }
}