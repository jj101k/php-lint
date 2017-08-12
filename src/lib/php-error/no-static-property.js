import _Error from "./error"
export default class NoStaticProperty extends _Error {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "No such accessible static identifier")
    }
}