import * as PHPType from "./php-type"
import * as PHPError from "./php-error"
import * as ParserStateOption from "./parser-state-option"
import ContextTypes from "./context-types"

import * as ClassContext from "./class-context"

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
     * @type {PHPType.Set}
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
     * @param {PHPType.Set} types
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
     * @param {(class_context: ClassContext.Partial) => ContextTypes} compile
     * @param {ClassContext.Partial} class_context
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
     * @returns {PHPType.Set}
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
     * @param {ClassContext.Partial} class_context
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
        this.identifiers[identifier.name] = identifier
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
     * @param {scope} calling_scope
     * @param {Set<ParserStateOption.Base>} parser_state
     * @returns {?PHPType.Set}
     */
    findIdentifier(name, calling_scope, parser_state) {
        let m = this.identifiers[name]
        let wrong_case
        if(m) {
            if(
                calling_scope == "private" ||
                m.scope == "public" ||
                m.scope == calling_scope
            ) {
                return m.types
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
            return this.findIdentifier(wrong_case, calling_scope, parser_state)
        } else if(this.classContext.parentEntity) {
            let warmed_superclass = this.classContext.parentEntity.warm(
                this.classContext.warmingFor || this.classContext
            )
            let ns = parser_state.has(ParserStateOption.InCall) ?
                warmed_superclass.identifiers.method :
                warmed_superclass.identifiers.property
            let coll = (this.isClassInstance) ? ns.instance : ns.static
            let superclass_types = coll.findIdentifier(
                name,
                (calling_scope == "private") ? "protected" : calling_scope,
                parser_state
            )
            if(superclass_types) {
                return superclass_types
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
        return Object.values(this.identifiers).filter(
            identifier => identifier.visibleInScope(scope)
        ).map(identifier => identifier.name)
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
 * A namespace of values.
 */
class AnyInstancePropertySet extends AnyIdentifierSet {
    /**
     *
     * @param {AnyIdentifier} identifier
     */
    add(identifier) {
        let name = identifier.name.replace(/^[$]/, "")
        this.identifiers[name] = identifier
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {scope} calling_scope
     * @param {Set<ParserStateOption.Base>} parser_state
     * @returns {?PHPType.Set}
     */
    findIdentifier(name, calling_scope, parser_state) {
        let type = super.findIdentifier(name, calling_scope, parser_state)
        if(type) {
            return type
        } else {
            if(
                !parser_state.has(ParserStateOption.InAssignment) &&
                name != "__get"
            ) {
                try {
                    if(this.classContext.identifiers.method.instance.findIdentifier(
                        "__get",
                        calling_scope,
                        new Set([ParserStateOption.InCall])
                    )) {
                        return new PHPType.Mixed(this.classContext.name, "__get").union
                    }
                } catch(e) {
                    if(!(e instanceof PHPError.ScopeMiss)) {
                        throw e
                    }
                }
            } else if(
                parser_state.has(ParserStateOption.InAssignment) &&
                name != "__set"
            ) {
                try {
                    if(this.classContext.identifiers.method.instance.findIdentifier(
                        "__set",
                        calling_scope,
                        new Set([ParserStateOption.InCall])
                    )) {
                        return new PHPType.Mixed(this.classContext.name, "__set").union
                    }
                } catch(e) {
                    if(!(e instanceof PHPError.ScopeMiss)) {
                        throw e
                    }
                }
            }
            throw new PHPError.ScopeMiss(
                `Property ${this.qualifiedName(name)} is not available/does not exist in scope ${calling_scope}`
            )
        }
    }

    /**
     *
     * @param {scope} scope
     * @return {string[]}
     */
    identifiersWithScope(scope = "private") {
        return super.identifiersWithScope(scope).map(
            name => name.replace(/^[$]/, "")
        )
    }
}

/**
 * A namespace of methods.
 */
class AnyInstanceMethodSet extends AnyIdentifierSet {
    /**
     *
     * @param {AnyIdentifier} identifier
     */
    add(identifier) {
        this.identifiers[identifier.name] = identifier
    }

    /**
     * Finds the named identifier
     * @param {string} name
     * @param {scope} calling_scope
     * @param {Set<ParserStateOption.Base>} parser_state
     * @returns {?PHPType.Set}
     */
    findIdentifier(name, calling_scope, parser_state) {
        let type = super.findIdentifier(name, calling_scope, parser_state)
        if(type) {
            return type
        } else {
            if(name != "__call") {
                return this.findIdentifier(
                    "__call",
                    calling_scope,
                    new Set([ParserStateOption.InCall])
                )
            }
            throw new PHPError.ScopeMiss(
                `Method ${this.qualifiedName(name)} is not available/does not exist in scope ${calling_scope}`
            )
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
     * @param {scope} calling_scope
     * @param {Set<ParserStateOption.Base>} parser_state
     * @returns {?PHPType.Set}
     */
    findIdentifier(name, calling_scope, parser_state) {
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
        return super.findIdentifier(name, calling_scope, parser_state)
    }
}

export {AnyIdentifierSet, AnyInstanceMethodSet, AnyInstancePropertySet, Identifier, TemporaryIdentifier, UnknownIdentifierSet}