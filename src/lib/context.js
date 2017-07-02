/**
 * Defines content in a specific class
 */
class ClassContext {
    /**
     * Builds the object
     * @param {string} name Fully qualified only
     */
    constructor(name) {
        this.name = name
        this.staticMethods = {}
        this.instanceMethods = {}
    }
    /**
     * Adds a known method
     * @param {string} name
     * @param {string} scope "public", "private" or "protected"
     * @param {boolean} is_static
     */
    addMethod(name, scope, is_static) {
        if(is_static) {
            this.staticMethods[name] = {
                scope: scope,
            }
        } else {
            this.instanceMethods[name] = {
                scope: scope
            }
        }
    }
}

/**
 * This defines content that's defined from the global scope, ie. everything
 * that is not anonymous.
 */
class GlobalContext {
    /**
     * Builds the context
     */
    constructor() {
        this.classes = {}
    }
    /**
     * Adds a known class
     * @param {string} name Fully qualified only
     * @returns {ClassContext}
     */
    addClass(name) {
        return this.classes[name] = this.classes[name] || new ClassContext(name)
    }
    /**
     * Finds the class context with the given name
     * @param {string} name Fully qualified only
     * @returns {?ClassContext}
     */
    findClass(name) {
        return this.classes[name]
    }
}

/**
 * This defines the entire context applying to the current node.
 */
export default class Context {
    /**
     * Builds the object
     * @param {?GlobalContext} global_context
     * @param {?ClassContext} class_context
     */
    constructor(global_context, class_context) {
        this.classContext = class_context
        this.globalContext = global_context || new GlobalContext()
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
        return new Context(this.globalContext, this.classContext)
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