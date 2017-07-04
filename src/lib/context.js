import {PHPFunctionType, PHPSimpleType, PHPTypeUnion} from "./phptype"

export class FileContext {
    /**
     *
     * @param {string} filename
     */
    constructor(filename) {
        this.filename = filename
    }
}

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
        this.staticIdentifiers = {}
        this.instanceIdentifiers = {}
    }
    /**
     * Adds a known identifier
     * @param {string} name
     * @param {string} scope "public", "private" or "protected"
     * @param {PHPTypeUnion} types
     * @param {boolean} is_static
     */
    addIdentifier(name, scope, is_static, types) {
        if(is_static) {
            this.staticIdentifiers[name] = {
                scope: scope,
                types: types,
            }
        } else {
            this.instanceIdentifiers[name] = {
                scope: scope,
                types: types,
            }
        }
    }
    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPTypeUnion}
     */
    findInstanceIdentifier(name, from_class_context) {
        let m = this.instanceIdentifiers[name]
        if(m) {
            if(from_class_context === this || m.scope == "public") {
                return m.types
            }
            // TODO inheritance
        }
        return null
    }
    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPTypeUnion}
     */
    findStaticIdentifier(name, from_class_context) {
        let m = this.staticIdentifiers[name]
        if(m) {
            if(from_class_context === this || m.scope == "public") {
                return m.types
            }
            // TODO inheritance
        }
        return null
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
     * @param {FileContext} file_context
     */
    constructor(file_context, global_context, class_context) {
        this.classContext = class_context
        this.globalContext = global_context || new GlobalContext()
        this.fileContext = file_context
        this.ns = {}
    }
    /**
     * Adds a name to the namespace list.
     * @param {string} name eg. "$foo"
     * @param {PHPTypeUnion} types
     * @returns {PHPTypeUnion} The original types
     */
    addName(name, types) {
        if(!this.ns[name]) {
            this.ns[name] = new PHPTypeUnion()
        }
        this.ns[name].addTypesFrom(types)
        //console.log(`Types for ${name} are: ${this.ns[name]}`)
        return types
    }
    /**
     * Returns a new context which inherits from this one.
     * @returns {Context}
     */
    childContext() {
        return new Context(this.fileContext, this.globalContext, this.classContext)
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