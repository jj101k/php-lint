import _Error from "./error"
export default class ScopeMiss extends _Error {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "Scope miss (not accessible from this scope)")
    }
}