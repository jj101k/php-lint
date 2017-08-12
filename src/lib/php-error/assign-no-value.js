import _Error from "./error"
export default class AssignNoValue extends _Error {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "Assignment with no value")
    }
}