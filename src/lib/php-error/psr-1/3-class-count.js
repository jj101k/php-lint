import _Error from "../error"
export default class S3ClassCount extends _Error {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "PSR-1 #3: One class per file")
    }
}