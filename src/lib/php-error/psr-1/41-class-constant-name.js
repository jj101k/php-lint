import _Error from "../error"
export default class S41ClassConstantName extends _Error {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "PSR-1 #4.1 class constant names must be CAPITALISED_WITH_UNDERSCORES")
    }
}