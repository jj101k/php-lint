import _Error from "./error"
export default class BadCoreType extends _Error {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "Misspelled reference to core type")
    }
}