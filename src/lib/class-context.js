import * as PHPType from "./php-type"
import * as PHPError from "./php-error"
import {FileContext} from "./file-context"
import * as ParserStateOption from "./parser-state-option"
import {Trait} from "./shadowtree"
import Context from "./context"

/**
 * Defines content in a specific class
 */
class PartialClassContext {
    /**
     * Builds the object
     * @param {string} name Fully qualified only
     * @param {?ClassContext} [superclass]
     * @param {?FileContext} [file_context]
     */
    constructor(name, superclass = null, file_context = null) {
        this.name = name
        this.fileContext = file_context
        /**
         * @type {{[x: string]: {scope: string, types: PHPType.Union}}}
         */
        this.staticIdentifiers = {
            class: {
                scope: "public",
                types: PHPType.Core.types.string,
            }
        }
        /**
         * @type {{[x: string]: {scope: string, types: PHPType.Union}}}
         */
        this.instanceIdentifiers = {}
        this.superclass = superclass
    }

    /**
     * @type {string[]}
     */
    get accessibleInstanceIdentifiers() {
        if(this.superclass) {
            return this.superclass.instanceIdentifiersWithScope("protected").concat(
                this.instanceIdentifiersWithScope("private")
            )
        } else {
            return this.instanceIdentifiersWithScope("private")
        }
    }

    /**
     * Adds a known identifier
     * @param {string} name
     * @param {string} scope "public", "private" or "protected"
     * @param {PHPType.Union} types
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
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @returns {?PHPType.Union}
     */
    findInstanceIdentifier(name, from_class_context, parser_state = new Set()) {
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
                throw new PHPError.ScopeMiss(
                    `Scope miss for name ${name} with scope ${m.scope} ($this instanceof ${from_class_context.name})`
                )
            }
            // TODO inheritance
        } else if(
            wrong_case = Object.keys(this.instanceIdentifiers).find(
                n => n.toLowerCase() == name.toLowerCase()
            )
        ) {
            console.log(
                `Wrong case for identifier, ${name} should be ${wrong_case}`
            )
            this.instanceIdentifiers[name] = this.instanceIdentifiers[wrong_case]
            return this.findInstanceIdentifier(wrong_case, from_class_context)
        } else if(this.superclass) {
            let superclass_types = this.superclass.findInstanceIdentifier(
                name,
                from_class_context
            )
            if(superclass_types) {
                return superclass_types
            }
        }
        if(parser_state.has(ParserStateOption.InCall) && name != "__call") {
            return this.findInstanceIdentifier(
                "__call",
                from_class_context,
                new Set([ParserStateOption.InCall])
            )
        } else if(!parser_state.has(ParserStateOption.InCall) && name != "__get") {
            if(this.findInstanceIdentifier(
                "__get",
                from_class_context,
                new Set([ParserStateOption.InCall])
            )) {
                return new PHPType.Mixed(this.name, "__get").union
            }
        }
        return null
    }

    /**
     * Finds the named identifier
     *
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPType.Union}
     */
    findStaticIdentifier(name, from_class_context) {
        let m = this.staticIdentifiers[name]
        let wrong_case
        if(m) {
            if(from_class_context === this || m.scope == "public") {
                return m.types
            }
        } else if(wrong_case = Object.keys(this.staticIdentifiers).find(n => n.toLowerCase() == name.toLowerCase())) {
            console.log(`Wrong case for identifier, ${name} should be ${wrong_case}`)
            this.staticIdentifiers[name] = this.staticIdentifiers[wrong_case]
            return this.findStaticIdentifier(wrong_case, from_class_context)
        } else if(this.superclass) {
            let superclass_types = this.superclass.findStaticIdentifier(
                name,
                from_class_context
            )
            if(superclass_types) {
                return superclass_types
            }
        } else {
            return null
        }
    }

    /**
     * Returns all local instance identifier names accessible with the supplied
     * scope.
     *
     * @param {string} scope
     * @return {string[]}
     */
    instanceIdentifiersWithScope(scope = "private") {
        return Object.keys(this.instanceIdentifiers).filter(identifier => {
            switch(scope) {
                case "private":
                    if(this.instanceIdentifiers[identifier].scope == "private") {
                        return true
                    }
                    //
                case "protected":
                    if(this.instanceIdentifiers[identifier].scope == "protected") {
                        return true
                    }
                case "public":
                    if(this.instanceIdentifiers[identifier].scope == "public") {
                        return true
                    }
                    //
                default:
                    return false
            }
        })
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
     * @param {string} name
     * @throws {PHPError.Error} when using "parent" with no superclass
     * @returns {?string}
     */
    resolveName(name) {
        if(name == "parent") {
            if(this.superclass) {
                return this.superclass.name
            } else {
                throw new PHPError.NoSuperclassParent()
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
 * Covers class behaviour
 */
class ClassContext extends PartialClassContext {

}

/**
 * This handles interfaces
 */
class InterfaceContext extends ClassContext {
    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPType.Union}
     */
    findInstanceIdentifier(name, from_class_context) {
        return super.findInstanceIdentifier(name, from_class_context)
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPType.Union}
     */
    findStaticIdentifier(name, from_class_context) {
        return super.findStaticIdentifier(name, from_class_context)
    }
}

/**
 * This handles traits
 */
class TraitContext extends PartialClassContext {
    /**
     * Builds the object
     * @param {string} name Fully qualified only
     * @param {?TraitContext} superclass
     * @param {FileContext} file_context
     * @param {Trait} trait_node
     */
    constructor(name, superclass, file_context, trait_node) {
        super(name, superclass, file_context)
        this.traitNode = trait_node
    }

    /**
     *
     * @param {Context} context
     * @returns {void}
     */
    export(context) {
        let inner_context = context.childContext(true)
        inner_context.fileContext = this.fileContext
        this.traitNode.checkInner(inner_context, new Set(), null)
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPType.Union}
     */
    findInstanceIdentifier(name, from_class_context) {
        return super.findInstanceIdentifier(name, from_class_context)
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPType.Union}
     */
    findStaticIdentifier(name, from_class_context) {
        return super.findStaticIdentifier(name, from_class_context)
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
     * @returns {?PHPType.Union}
     */
    findInstanceIdentifier(name, from_class_context) {
        // TODO: Limit to the actual methods.
        return PHPType.Core.types.mixed
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPType.Union}
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
     * @returns {?PHPType.Union}
     */
    findInstanceIdentifier(name, from_class_context) {
        if(!this.instanceIdentifiers[name]) {
            this.instanceIdentifiers[name] = {
                scope: "public",
                types: new PHPType.Mixed(this.name, name).union,
            }
        }
        return super.findInstanceIdentifier(name, from_class_context)
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPType.Union}
     */
    findStaticIdentifier(name, from_class_context) {
        if(!this.staticIdentifiers[name]) {
            this.staticIdentifiers[name] = {
                scope: "public",
                types: new PHPType.Mixed(this.name, name).union,
            }
        }
        return super.findStaticIdentifier(name, from_class_context)
    }
}


/**
 * This handles unknown traits
 */
class UnknownTraitContext extends TraitContext {
    /**
     * Builds the object
     * @param {string} name Fully qualified only
     */
    constructor(name, superclass = null) {
        super(name, null, null, null)
    }

    /**
     *
     * @param {Context} context
     * @returns {void}
     */
    export(context) {
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPType.Union}
     */
    findInstanceIdentifier(name, from_class_context) {
        if(!this.instanceIdentifiers[name]) {
            this.instanceIdentifiers[name] = {
                scope: "public",
                types: new PHPType.Mixed(this.name, name).union,
            }
        }
        return super.findInstanceIdentifier(name, from_class_context)
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPType.Union}
     */
    findStaticIdentifier(name, from_class_context) {
        if(!this.staticIdentifiers[name]) {
            this.staticIdentifiers[name] = {
                scope: "public",
                types: new PHPType.Mixed(this.name, name).union,
            }
        }
        return super.findStaticIdentifier(name, from_class_context)
    }
}

export {AnonymousFunctionContext as AnonymousFunction}
export {ClassContext as Class}
export {InterfaceContext as Interface}
export {TraitContext as Trait}
export {UnknownClassContext as UnknownClass}
export {UnknownTraitContext as UnknownTrait}