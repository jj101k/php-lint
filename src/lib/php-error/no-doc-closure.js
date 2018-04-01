import NoDoc from "./no-doc"
export default class NoDocClosure extends NoDoc {
    /**
     * Builds the object
     * @param {?string} message Any overriding message
     */
    constructor(message = null) {
        super(message || "No documentation for closure")
    }
}