import {PHPTypeUnion, PHPSimpleType} from "./phptype"
import {PHPContextlessError} from "./php-strict-error"
import {FileContext} from "./file-context"

/**
 * Defines content in a specific class
 */
class ClassContext {
    /**
     * Builds the object
     * @param {string} name Fully qualified only
     * @param {?ClassContext} [superclass]
     * @param {?FileContext} [file_context]
     */
    constructor(name, superclass = null, file_context = null) {
        this.name = name
        this.fileContext = file_context
        this.staticIdentifiers = {}
        this.instanceIdentifiers = {}
        this.superclass = superclass
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
            this.instanceIdentifiers[name.replace(/^[$]/, "")] = {
                scope: scope,
                types: types,
            }
        }
    }
    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @param {boolean} [in_call]
     * @returns {?PHPTypeUnion}
     */
    findInstanceIdentifier(name, from_class_context, in_call = false) {
        let m = this.instanceIdentifiers[name]
        let wrong_case
        if(m) {
            if(
                m.scope == "public" ||
                (
                    m.scope == "protected" &&
                    from_class_context.isSubclassOf(this)
                ) ||
                from_class_context === this
            ) {
                return m.types
            } else {
                throw new PHPContextlessError(
                    `Scope miss for name ${name} with scope ${m.scope}`
                )
            }
            // TODO inheritance
        } else if(wrong_case = Object.keys(this.instanceIdentifiers).find(n => n.toLowerCase() == name.toLowerCase())) {
            console.log(`Wrong case for identifier, ${name} != ${wrong_case}`)
            this.instanceIdentifiers[name] = this.instanceIdentifiers[wrong_case]
            return this.findInstanceIdentifier(wrong_case, from_class_context)
        } else if(this.superclass) {
            let superclass_types = this.superclass.findInstanceIdentifier(name, from_class_context)
            if(superclass_types) {
                return superclass_types
            }
        }
        if(in_call && name != "__call") {
            return this.findInstanceIdentifier("__call", from_class_context, true)
        } else if(!in_call && name != "__get") {
            if(this.findInstanceIdentifier("__get", from_class_context, true)) {
                return PHPSimpleType.coreTypes.mixed
            }
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
        let wrong_case
        if(m) {
            if(from_class_context === this || m.scope == "public") {
                return m.types
            }
        } else if(wrong_case = Object.keys(this.staticIdentifiers).find(n => n.toLowerCase() == name.toLowerCase())) {
            console.log(`Wrong case for identifier, ${name} != ${wrong_case}`)
            this.staticIdentifiers[name] = this.staticIdentifiers[wrong_case]
            return this.findStaticIdentifier(wrong_case, from_class_context)
        } else if(this.superclass) {
            let superclass_types = this.superclass.findStaticIdentifier(name, from_class_context)
            if(superclass_types) {
                return superclass_types
            }
        }
        return null
    }

    /**
     * Imports a trait into the current context
     *
     * @param {ClassContext} trait
     */
    importTrait(trait) {
        for(var k in trait.staticIdentifiers) {
            this.staticIdentifiers[k] = trait.staticIdentifiers[k]
        }
        for(var k in trait.instanceIdentifiers) {
            this.instanceIdentifiers[k] = trait.instanceIdentifiers[k]
        }
    }

    /**
     * Returns true if this is a subclass of that class.
     * @param {ClassContext} other_class
     * @returns {boolean}
     */
    isSubclassOf(other_class) {
        if(this.superclass) {
            return(
                this.superclass === other_class ||
                this.superclass.isSubclassOf(other_class)
            )
        } else {
            return false
        }
    }

    /**
     * The fully resolved name. This just handles "parent", "self" and "static";
     * everything else returns null.
     *
     * @param {string} context
     * @throws {PHPContextlessError} when using "parent" with no superclass
     * @returns {?string}
     */
    resolveName(name) {
        if(name == "parent") {
            if(this.superclass) {
                return this.superclass.name
            } else {
                throw new PHPContextlessError(`Attempt to use parent:: with no superclass`)
            }
        } else if(name == "self") {
            return this.name
        } else if(name == "static") {
            return this.name
        } else {
            return null
        }
    }
}

/**
 * This handles interfaces
 */
class InterfaceContext extends ClassContext {
    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPTypeUnion}
     */
    findInstanceIdentifier(name, from_class_context) {
        return super.findInstanceIdentifier(name, from_class_context) || PHPSimpleType.coreTypes.mixed
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPTypeUnion}
     */
    findStaticIdentifier(name, from_class_context) {
        return super.findStaticIdentifier(name, from_class_context) || PHPSimpleType.coreTypes.mixed
    }
}

/**
 * This handles traits
 */
class TraitContext extends ClassContext {
    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPTypeUnion}
     */
    findInstanceIdentifier(name, from_class_context) {
        return super.findInstanceIdentifier(name, from_class_context) || PHPSimpleType.coreTypes.mixed
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPTypeUnion}
     */
    findStaticIdentifier(name, from_class_context) {
        return super.findStaticIdentifier(name, from_class_context) || PHPSimpleType.coreTypes.mixed
    }
}

/**
 * This handles functions when accessed as objects.
 */
class AnonymousFunctionContext extends ClassContext {
    static get inst() {
        if(!this._inst) {
            this._inst = new AnonymousFunctionContext()
        }
        return this._inst
    }
    /**
     * Builds the object
     */
    constructor() {
        super("() -> ()") // Just something that looks functiony.
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPTypeUnion}
     */
    findInstanceIdentifier(name, from_class_context) {
        // TODO: Limit to the actual methods.
        return PHPSimpleType.coreTypes.mixed
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPTypeUnion}
     */
    findStaticIdentifier(name, from_class_context) {
        return null
    }
}

/**
 * This handles unknown classes
 */
class UnknownClassContext extends ClassContext {
    /**
     * Builds the object
     * @param {string} name Fully qualified only
     */
    constructor(name, superclass = null) {
        super(name)
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPTypeUnion}
     */
    findInstanceIdentifier(name, from_class_context) {
        return PHPSimpleType.coreTypes.mixed
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPTypeUnion}
     */
    findStaticIdentifier(name, from_class_context) {
        return PHPSimpleType.coreTypes.mixed
    }
}

export {AnonymousFunctionContext, ClassContext, InterfaceContext, TraitContext, UnknownClassContext}