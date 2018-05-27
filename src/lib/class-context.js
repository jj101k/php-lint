import * as PHPType from "./php-type"
import * as PHPError from "./php-error"
import {FileContext} from "./file-context"
import * as ParserStateOption from "./parser-state-option"
import * as ShadowTree from "./shadowtree"
import Context from "./context"
import ContextTypes from "./context-types"

/**
 * @typedef {"public" | "private" | "protected"} scope
 */

/**
 * Represents a value or function.
 */
class AnyIdentifier {
    /**
     * @param {string} name
     * @param {scope} scope
     */
    constructor(name, scope) {
        this.name = name
        this.scope = scope
    }
    /**
     * @type {PHPType.Union}
     */
    get types() {
        throw new Error("Not implemented")
    }
    /**
     *
     * @param {scope} scope
     * @returns {boolean}
     */
    visibleInScope(scope) {
        switch(scope) {
            case "private":
                if(this.scope == "private") {
                    return true
                }
                //
            case "protected":
                if(this.scope == "protected") {
                    return true
                }
            case "public":
                if(this.scope == "public") {
                    return true
                }
                //
            default:
                return false
        }
    }
}

/**
 * Represents a value or function.
 */
class Identifier extends AnyIdentifier {
    /**
     * @param {string} name
     * @param {scope} scope
     * @param {PHPType.Union} types
     */
    constructor(name, scope, types) {
        super(name, scope)
        this._types = types
    }
    get types() {
        return this._types
    }
}

/**
 * Represents a value or function (method) that's not yet compiled.
 */
class TemporaryIdentifier extends AnyIdentifier {
    /**
     * @param {string} name
     * @param {scope} scope
     * @param {(class_context: PartialClassContext) => ContextTypes} compile
     * @param {PartialClassContext} class_context
     */
    constructor(name, scope, compile, class_context) {
        super(name, scope)
        this.classContext = class_context
        this.compileInner = compile
        this.compileStarted = false
        this.name = name
        this.scope = scope
    }
    get types() {
        return this.compile()
    }
    /**
     * Triggers compilation
     *
     * @returns {PHPType.Union}
     */
    compile() {
        if(this.compileStarted) {
            //console.log(`Recursive compile of ${class_context.name}#${this.name}`)
            return new PHPType.Mixed(this.classContext.name, this.name).union
        } else {
            //console.log(`Compile ${class_context.name}#${this.name}`)
            this.compileStarted = true
            return this.compileInner(this.classContext).expressionType
        }
    }
}

/**
 * A namespace of values.
 */
class AnyIdentifierSet {
    /**
     * Builds the object
     * @param {PartialClassContext} class_context
     * @param {boolean} is_class_instance True if this is the instance collection for a class
     */
    constructor(class_context, is_class_instance) {
        this.classContext = class_context
        this.identifiers = {}
        this.isClassInstance = is_class_instance
    }

    /**
     *
     * @param {AnyIdentifier} identifier
     */
    add(identifier) {
        let name = this.isClassInstance ?
            identifier.name.replace(/^[$]/, "") :
            identifier.name
        this.identifiers[name] = identifier
    }

    /**
     * Compiles any temporary identifiers
     */
    compile() {
        Object.values(this.identifiers).forEach(
            ti => {
                if(ti instanceof TemporaryIdentifier) {
                    ti.compile()
                }
            }
        )
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @returns {?PHPType.Union}
     */
    findIdentifier(name, from_class_context, parser_state = new Set()) {
        let m = this.identifiers[name]
        let wrong_case
        if(m) {
            if(
                m.scope == "public" ||
                (
                    m.scope == "protected" &&
                    from_class_context &&
                    (
                        from_class_context.isSubclassOf(this.classContext) ||
                        this.classContext.isSubclassOf(from_class_context)
                    )
                ) ||
                (
                    from_class_context &&
                    from_class_context.name == this.classContext.name
                )
            ) {
                return m.types
            } else if(this.isClassInstance) {
                if(parser_state.has(ParserStateOption.InCall) && name != "__call") {
                    console.log(
                        `Possible scope miss for name ${this.qualifiedName(name)} with scope ${m.scope}`
                    )
                    return this.findIdentifier(
                        "__call",
                        from_class_context,
                        new Set([ParserStateOption.InCall])
                    )
                } else if(
                    !parser_state.has(ParserStateOption.InCall) &&
                    !parser_state.has(ParserStateOption.InAssignment) &&
                    name != "__get"
                ) {
                    if(this.findIdentifier(
                        "__get",
                        from_class_context,
                        new Set([ParserStateOption.InCall])
                    )) {
                        console.log(
                            `Possible scope miss for name ${this.qualifiedName(name)} with scope ${m.scope}`
                        )
                        return new PHPType.Mixed(this.classContext.name, "__get").union
                    }
                } else if(
                    !parser_state.has(ParserStateOption.InCall) &&
                    parser_state.has(ParserStateOption.InAssignment) &&
                    name != "__set"
                ) {
                    if(this.findIdentifier(
                        "__set",
                        from_class_context,
                        new Set([ParserStateOption.InCall])
                    )) {
                        console.log(
                            `Possible scope miss for name ${this.qualifiedName(name)} with scope ${m.scope}`
                        )
                        return new PHPType.Mixed(this.classContext.name, "__set").union
                    }
                }
                throw new PHPError.ScopeMiss(
                    `Scope miss for name ${this.qualifiedName(name)} with scope ${m.scope} ($this instanceof ${from_class_context.name})`
                )
            }
            // TODO inheritance
        } else if(
            wrong_case = Object.keys(this.identifiers).find(
                n => n.toLowerCase() == name.toLowerCase()
            )
        ) {
            console.log(
                `Wrong case for instance identifier, ${name} should be ${wrong_case}`
            )
            this.identifiers[name] = this.identifiers[wrong_case]
            return this.findIdentifier(wrong_case, from_class_context)
        } else if(this.classContext.parentEntity) {
            let superclass_types = this.classContext.parentEntity.warm(
                this.classContext.warmingFor || this.classContext
            ).findInstanceIdentifier(
                name,
                from_class_context
            )
            if(superclass_types) {
                return superclass_types
            }
        }
        if(this.isClassInstance) {
            if(parser_state.has(ParserStateOption.InCall) && name != "__call") {
                return this.findIdentifier(
                    "__call",
                    from_class_context,
                    new Set([ParserStateOption.InCall])
                )
            } else if(
                !parser_state.has(ParserStateOption.InCall) &&
                !parser_state.has(ParserStateOption.InAssignment) &&
                name != "__get"
            ) {
                if(this.findIdentifier(
                    "__get",
                    from_class_context,
                    new Set([ParserStateOption.InCall])
                )) {
                    return new PHPType.Mixed(this.classContext.name, "__get").union
                }
            } else if(
                !parser_state.has(ParserStateOption.InCall) &&
                parser_state.has(ParserStateOption.InAssignment) &&
                name != "__set"
            ) {
                if(this.findIdentifier(
                    "__set",
                    from_class_context,
                    new Set([ParserStateOption.InCall])
                )) {
                    return new PHPType.Mixed(this.classContext.name, "__set").union
                }
            }
        }
        return null
    }

    /**
     *
     * @param {scope} scope
     * @return {string[]}
     */
    identifiersWithScope(scope = "private") {
        let names = Object.values(this.identifiers).filter(
            identifier => identifier.visibleInScope(scope)
        ).map(identifier => identifier.name)
        if(this.isClassInstance) {
            return names.map(name => name.replace(/^[$]/, ""))
        } else {
            return names
        }
    }

    /**
     * Returns the given name as qualified for this colletion.
     *
     * @param {string} name
     * @returns {string}
     */
    qualifiedName(name) {
        if(this.classContext) {
            if(this.isClassInstance) {
                return `${this.classContext.name}#${name}`
            } else {
                return `${this.classContext.name}::${name}`
            }
        }
    }
}

/**
 * Identifier sets for unknown classes
 */
class UnknownIdentifierSet extends AnyIdentifierSet {
    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @returns {?PHPType.Union}
     */
    findIdentifier(name, from_class_context, parser_state = new Set()) {
        if(!this.identifiers[name]) {
            if(this.isClassInstance) {
                let type
                if(parser_state.has(ParserStateOption.InCall)) {
                    type = new PHPType.Function(
                        [new PHPType.Mixed(this.classContext.name, name, "~function#in").union],
                        new PHPType.Mixed(this.classContext.name, name, "~function#out").union
                    ).union
                } else {
                    type = new PHPType.Mixed(this.classContext.name, name).union
                }
                this.identifiers[name] = new Identifier(name, "public", type)
            } else {
                this.identifiers[name] =
                    new Identifier(name, "public", new PHPType.Mixed(this.classContext.name, name).union)
            }
        }
        return super.findIdentifier(name, from_class_context, parser_state)
    }
}

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
         * @type {{static: AnyIdentifierSet, instance: AnyIdentifierSet}}
         */
        this.identifiers = {
            static: new AnyIdentifierSet(this, false),
            instance: new AnyIdentifierSet(this, true),
        }
        this.identifiers.static.add(
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
     * @param {PHPType.Union} types
     * @param {boolean} is_static
     */
    addIdentifier(name, scope, is_static, types) {
        if(is_static) {
            this.identifiers.static.add(new Identifier(name, scope, types))
        } else {
            this.identifiers.instance.add(new Identifier(name, scope, types))
        }
    }

    /**
     * A lot like addIdentifier, except that this tries to add a replacer to be
     * invoked immediately on access.
     *
     * @param {string} name
     * @param {scope} scope
     * @param {boolean} is_static
     * @param {(class_context: PartialClassContext) => ContextTypes} compile
     */
    addTemporaryIdentifier(name, scope, is_static, compile) {
        let canonical_name = is_static ? name : name.replace(/^[$]/, "")
        if(is_static) {
            this.identifiers.static.add(new TemporaryIdentifier(
                name,
                scope,
                compile,
                this
            ))
        } else {
            this.identifiers.instance.add(new TemporaryIdentifier(
                name,
                scope,
                compile,
                this
            ))
        }
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
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @returns {?PHPType.Union}
     */
    findInstanceIdentifier(name, from_class_context, parser_state = new Set()) {
        return this.identifiers.instance.findIdentifier(name, from_class_context, parser_state)
    }

    /**
     * Finds the named identifier
     *
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPType.Union}
     */
    findStaticIdentifier(name, from_class_context) {
        return this.identifiers.static.findIdentifier(name, from_class_context, new Set())
    }

    /**
     * Returns all local instance identifier names accessible with the supplied
     * scope.
     *
     * @param {scope} scope
     * @return {string[]}
     */
    instanceIdentifiersWithScope(scope = "private") {
        return this.identifiers.instance.identifiersWithScope(scope)
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
        return this.identifiers.static.identifiersWithScope(scope)
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
        Object.values(this.identifiers).forEach(coll => coll.compile())
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
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @returns {?PHPType.Union}
     */
    findInstanceIdentifier(name, from_class_context, parser_state = new Set()) {
        // TODO: Limit to the actual methods.
        if(parser_state.has(ParserStateOption.InCall)) {
            return new PHPType.Function(
                [new PHPType.Mixed(this.name, name, "~function#in").union],
                new PHPType.Mixed(this.name, name, "~function#out").union
            ).union
        } else {
            return new PHPType.Mixed(this.name, name).union
        }
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
        super(name, superclass, null, null, [])
        this.identifiers.instance = new UnknownIdentifierSet(this, true)
        this.identifiers.static = new UnknownIdentifierSet(this, false)
        this.identifiers.static.add(
            new Identifier("class", "public", PHPType.Core.types.string)
        )
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
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @returns {?PHPType.Union}
     */
    findInstanceIdentifier(name, from_class_context, parser_state = new Set()) {
        if(!this.identifiers.instance[name]) {
            let type
            if(parser_state.has(ParserStateOption.InCall)) {
                type = new PHPType.Function(
                    [new PHPType.Mixed(this.name, name, "~function#in").union],
                    new PHPType.Mixed(this.name, name, "~function#out").union
                ).union
            } else {
                type = new PHPType.Mixed(this.name, name).union
            }
            this.identifiers.instance[name] = new Identifier(name, "public", type)
        }
        return super.findInstanceIdentifier(name, from_class_context, parser_state)
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {?ClassContext} from_class_context
     * @returns {?PHPType.Union}
     */
    findStaticIdentifier(name, from_class_context) {
        if(!this.identifiers.static[name]) {
            this.identifiers.static[name] =
                new Identifier(name, "public", new PHPType.Mixed(this.name, name).union)
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