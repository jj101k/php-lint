/**
 * This defines content that's defined from the global scope, ie. everything
 * that is not anonymous.
 */
class GlobalContext {
    /**
     * Builds the context
     */
    constructor() {

    }
}

/**
 * This defines the entire context applying to the current node.
 */
export default class Context {
    /**
     * Builds the object
     * @param {?GlobalContext} global_context
     */
    constructor(global_context) {
        this.global = global_context || new GlobalContext()
        this.ns = {}
    }
    /**
     * Adds a name to the namespace list.
     * @param {string} name eg. "$foo"
     * @param {string[]} types
     * @returns {string[]} The original types
     */
    addName(name, types) {
        if(!this.ns[name]) {
            this.ns[name] = []
        }
        this.ns[name] = this.ns[name].concat(types)
        return types
    }
    /**
     * Returns a new context which inherits from this one.
     * @returns {Context}
     */
    childContext() {
        return new Context(this.global)
    }
    /**
     * If the name is in the namespace, returns its possible types
     * @param {string} name eg "$bar"
     * @returns {boolean}
     */
    findName(name) {
        var types = this.ns[name]
        return types
    }
}