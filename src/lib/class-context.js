import * as PHPType from "./php-type"
import * as PHPError from "./php-error"
import {FileContext} from "./file-context"
import * as ParserStateOption from "./parser-state-option"
import * as ShadowTree from "./shadowtree"
import Context from "./context"
import ContextTypes from "./context-types"

import {AnyIdentifierSet, AnyInstanceMethodSet, AnyInstancePropertySet, Identifier, TemporaryIdentifier, UnknownIdentifierSet} from "./identifier-set"

/**
 * @typedef {"public" | "private" | "protected"} scope
 */

/**
 * Defines content in a specific class
 */
class PartialClassContext {
    /**
     * Builds the object
     * @param {string} name Fully qualified only
     * @param {?FileContext} [file_context]
     */
    constructor(name, file_context = null) {
        this.name = name
        this.fileContext = file_context

        /**
         * @type {{method: {static: AnyIdentifierSet, instance: AnyIdentifierSet}, property: {static: AnyIdentifierSet, instance: AnyIdentifierSet}}}}
         */
        this.identifiers = {
            method: {
                static: new AnyIdentifierSet(this, false),
                instance: new AnyInstanceMethodSet(this, true),
            },
            property: {
                static: new AnyIdentifierSet(this, false),
                instance: new AnyInstancePropertySet(this, true),
            },
        }
        this.identifiers.property.static.add(
            new Identifier("class", "public", PHPType.Core.types.string)
        )
        this.warmingFor = null
    }

    /**
     * @type {string[]}
     */
    get accessibleInstanceIdentifiers() {
        if(this.parentEntity) {
            return this.parentEntity.warm(this.warmingFor || this).instanceIdentifiersWithScope("protected").concat(
                this.instanceIdentifiersWithScope("private")
            )
        } else {
            return this.instanceIdentifiersWithScope("private")
        }
    }

    /**
     * @type {string[]}
     */
    get accessibleStaticIdentifiers() {
        if(this.parentEntity) {
            return this.parentEntity.warm(this.warmingFor || this).staticIdentifiersWithScope("protected").concat(
                this.staticIdentifiersWithScope("private")
            )
        } else {
            return this.staticIdentifiersWithScope("private")
        }
    }

    /**
     * @type {PartialClassContext}
     */
    get parentEntity() {
        throw new Error("Not implemented")
    }

    /**
     * Adds a known identifier
     * @param {string} name
     * @param {scope} scope
     * @param {boolean} is_static
     * @param {boolean} is_method
     * @param {PHPType.Set} types
     */
    addIdentifier(name, scope, is_static, is_method, types) {
        let ns = is_method ? this.identifiers.method : this.identifiers.property
        let coll = is_static ? ns.static : ns.instance
        coll.add(new Identifier(name, scope, types))
    }

    /**
     * A lot like addIdentifier, except that this tries to add a replacer to be
     * invoked immediately on access.
     *
     * @param {string} name
     * @param {scope} scope
     * @param {boolean} is_static
     * @param {boolean} is_method
     * @param {(class_context: PartialClassContext) => ContextTypes} compile
     */
    addTemporaryIdentifier(name, scope, is_static, is_method, compile) {
        let ns = is_method ? this.identifiers.method : this.identifiers.property
        let coll = is_static ? ns.static : ns.instance
        let canonical_name = is_static ? name : name.replace(/^[$]/, "")
        coll.add(new TemporaryIdentifier(
            name,
            scope,
            compile,
            this
        ))
    }

    /**
     * Returns a copy of this class with nothing but the top-level metadata (as
     * it was when originally loaded).
     *
     * This means everything needs to be reevaluated.
     *
     * As a fallback this may return the original object.
     *
     * @returns {PartialClassContext}
     */
    coldCopy() {
        return this
    }

    /**
     * Finds the named identifier
     *
     * @param {"static"|"instance"} type
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @param {Set<ParserStateOption.Base>} parser_state
     * @returns {?PHPType.Set}
     */
    findIdentifier(type, name, from_class_context, parser_state) {
        let ns = parser_state.has(ParserStateOption.InCall) ?
            this.identifiers.method :
            this.identifiers.property
        let collection = (type == "static") ? ns.static : ns.instance
        return collection.findIdentifier(
            name,
            this.scopeFrom(from_class_context),
            parser_state
        )
    }

    /**
     * Returns all local instance identifier names accessible with the supplied
     * scope.
     *
     * @param {scope} scope
     * @return {string[]}
     */
    instanceIdentifiersWithScope(scope = "private") {
        return this.identifiers.property.instance.identifiersWithScope(scope).concat(
            this.identifiers.method.instance.identifiersWithScope(scope)
        )
    }

    /**
     * Returns true if this is a subclass of that class.
     *
     * @param {PartialClassContext} other_class
     * @returns {boolean}
     */
    isSubclassOf(other_class) {
        if(this.parentEntity) {
            return(
                this.parentEntity.name == other_class.name ||
                this.parentEntity.isSubclassOf(other_class)
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
            if(this.parentEntity) {
                return this.parentEntity.name
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
    /**
     * Returns the best access scope available from the given class context.
     *
     * @param {?ClassContext} from_class_context
     * @returns {scope}
     */
    scopeFrom(from_class_context) {
        /**
         * @type {scope}
         */
        let calling_scope
        if(from_class_context && from_class_context.name == this.name) {
            return "private"
        } else if(
            from_class_context &&
            (
                from_class_context.isSubclassOf(this) ||
                this.isSubclassOf(from_class_context)
            )
        ) {
            return "protected"
        } else {
            return "public"
        }
    }
    /**
     * @param {ClassContext} from_class
     * @return {this}
     */
    warm(from_class) {
        console.log("NOOP warm on " + this.name)
        return this
    }

    /**
     * Returns all local static identifier names accessible with the supplied
     * scope.
     *
     * @param {scope} scope
     * @return {string[]}
     */
    staticIdentifiersWithScope(scope = "private") {
        return this.identifiers.property.static.identifiersWithScope(scope).concat(
            this.identifiers.method.static.identifiersWithScope(scope)
        )
    }
}

/**
 * Covers class behaviour
 */
class ClassContext extends PartialClassContext {
    /**
     * Builds the object
     * @param {string} name Fully qualified only
     * @param {?ClassContext} superclass
     * @param {FileContext} file_context
     * @param {?{context: Context, node: ShadowTree.Class}} warm_info
     * @param {string[]} interface_names
     */
    constructor(name, superclass, file_context, warm_info, interface_names) {
        super(name, file_context)
        this.superclass = superclass ? superclass.coldCopy() : null
        this.warmInfo = warm_info
        this.isCold = true
        this.interfaceNames = interface_names
    }

    get parentEntity() {
        return this.superclass
    }

    /**
     * Compiles all temporary entities
     */
    compile() {
        Object.values(this.identifiers).forEach(ns => {
            Object.values(ns).forEach(coll => coll.compile())
        })
    }

    coldCopy() {
        return new ClassContext(
            this.name,
            this.superclass,
            this.fileContext,
            this.warmInfo,
            this.interfaceNames
        )
    }

    /**
     * @param {ClassContext} from_class
     * @return {this}
     */
    warm(from_class) {
        if(this.isCold && this.warmInfo) {
            this.isCold = false
            this.warmingFor = from_class
            this.warmInfo.context.classContext = this
            this.warmInfo.context.setThis(PHPType.Core.named(from_class.name))
            this.warmInfo.node.checkInner(this.warmInfo.context, new Set(), null)
            this.warmingFor = null
        } else if(!this.warmInfo) {
            //console.log(`Cannot warm ${this.name}`)
        }
        return this
    }
}

/**
 * This handles interfaces
 */
class InterfaceContext extends ClassContext {
    /**
     * Builds the object
     * @param {string} name Fully qualified only
     * @param {?ClassContext} superclass
     * @param {FileContext} file_context
     */
    constructor(name, superclass, file_context) {
        super(name, superclass, file_context, null, [])
        this.superclass = superclass // Not cold copy
        this.isCold = false
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
     * @param {ShadowTree.Trait} trait_node
     */
    constructor(name, superclass, file_context, trait_node) {
        super(name, file_context)
        this.superclass = superclass
        this.traitNode = trait_node
        this.isCold = true
    }

    get parentEntity() {
        return this.superclass
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
        super("() -> ()", null, null, null, []) // Just something that looks functiony.
    }

    /**
     * Finds the named identifier
     *
     * @param {"static"|"instance"} type
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @param {Set<ParserStateOption.Base>} parser_state
     * @returns {?PHPType.Set}
     */
    findIdentifier(type, name, from_class_context, parser_state) {
        if(type == "instance") {
            // TODO: Limit to the actual methods.
            if(parser_state.has(ParserStateOption.InCall)) {
                return new PHPType.Function(
                    [new PHPType.Mixed(this.name, name, "~function#in").union],
                    new PHPType.Mixed(this.name, name, "~function#out").union
                ).union
            } else {
                return new PHPType.Mixed(this.name, name).union
            }
        } else {
            return null
        }
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
        super(name, superclass, null, null, [])
        this.identifiers.property.instance = new UnknownIdentifierSet(this, true)
        this.identifiers.property.static = new UnknownIdentifierSet(this, false)
        this.identifiers.property.static.add(
            new Identifier("class", "public", PHPType.Core.types.string)
        )
        this.identifiers.method.instance = new UnknownIdentifierSet(this, true)
        this.identifiers.method.static = new UnknownIdentifierSet(this, false)
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
     *
     * @param {"static"|"instance"} type
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @param {Set<ParserStateOption.Base>} parser_state
     * @returns {?PHPType.Set}
     */
    findIdentifier(type, name, from_class_context, parser_state) {
        if(type == "instance") {
            let ns = parser_state.has(ParserStateOption.InCall) ?
                this.identifiers.method :
                this.identifiers.property
            if(!ns.instance[name]) {
                let type
                if(parser_state.has(ParserStateOption.InCall)) {
                    type = new PHPType.Function(
                        [new PHPType.Mixed(this.name, name, "~function#in").union],
                        new PHPType.Mixed(this.name, name, "~function#out").union
                    ).union
                } else {
                    type = new PHPType.Mixed(this.name, name).union
                }
                ns.instance[name] = new Identifier(name, "public", type)
            }
        } else {
            let ns = parser_state.has(ParserStateOption.InCall) ?
                this.identifiers.method :
                this.identifiers.property
            if(!ns.static[name]) {
                ns.static[name] =
                    new Identifier(name, "public", new PHPType.Mixed(this.name, name).union)
            }
        }
        return super.findIdentifier(type, name, from_class_context, parser_state)
    }
}

export {AnonymousFunctionContext as AnonymousFunction}
export {ClassContext as Class}
export {InterfaceContext as Interface}
export {PartialClassContext as Partial}
export {TraitContext as Trait}
export {UnknownClassContext as UnknownClass}
export {UnknownTraitContext as UnknownTrait}