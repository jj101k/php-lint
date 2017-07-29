import PHPStrictError, {PHPContextlessError} from "./phpstricterror"
import Context from "./context"
import {PHPFunctionType, PHPSimpleType, PHPTypeUnion} from "./phptype"

/** @type {boolean} True if you want lots of debugging messages */
const DEBUG = false

/**
 * The types applicable to this point in the code.
 */
class ContextTypes {
    /**
     * @type {ContextTypes} A completely empty value/return
     */
    static get empty() {
        return new ContextTypes(PHPTypeUnion.empty)
    }
    /**
     * Builds the object
     * @param {PHPTypeUnion} expression_type This is the type that you'd get on
     * assignment to this node.
     * @param {PHPTypeUnion} [return_type]  This is the type that you'd get in
     * code which calls the function which wraps this node. Only a handful of
     * node types should set this: blocks ({}, foreach, if, switch, while) and
     * the return statement itelf.
     */
    constructor(expression_type, return_type = PHPTypeUnion.empty) {
        this.expressionType = expression_type
        this.returnType = return_type
    }
}

/**
 * @typedef ParserNode
 * @property {function} constructor
 * @property {string} kind
 * @property {?ParserLocation} loc
 */

/**
 * @typedef ParserPosition
 * @property {number} line
 * @property {number} column
 * @property {number} offset
 */

/**
 * @typedef ParserLocation
 * @property {?string} source
 * @property {ParserPosition} start
 * @property {ParserPosition} end
 */

/**
 * @callback cachePropertyCallback
 * @param {Object} node_property
 * @returns {Object}
 */

 /**
  * The superclass for all AST nodes
  */
class Node {
    /**
     * Builds the shadow node
     * @param {ParserNode} node
     */
    constructor(node) {
        this._cache = {}
        /** @type {Object} */
        this.node = node
    }
    /** @type {string} */
    get kind() {
        return this.node.kind;
    }
    /** @type {?ParserLocation} */
    get loc() {
        return this.node.loc;
    }
    /**
     * Returns the types for the local name, or throws
     * @param {Context} context
     * @param {string} name
     * @returns {?PHPTypeUnion}
     */
    assertHasName(context, name) {
        var types = context.findName(name)
        if(!types) {
            let loc = this.loc
            if(!loc) {
                loc = Object.keys(this.node).map(
                    k => this.node[k] && this.node[k].loc
                ).find(l => l)
            }
            throw new PHPStrictError(
                `Name ${name} is not defined in this namespace, contents are: ${context.definedVariables.join(", ")}`,
                context,
                loc
            );
        }
        return types
    }
    /**
     * Returns a shadow tree node wrapping the given node (caches)
     * @param {string} name
     * @returns {?Node}
     */
    cacheNode(name) {
        return this.cacheProperty(
            name,
            subnode => subnode ?
                Node.typed(subnode) :
                subnode
        );
    }
    /**
     * Returns a nominal array of shadow tree nodes wrapping the given nodes
     * (caches)
     * @param {string} name
     * @returns {?Node[]}
     */
    cacheNodeArray(name) {
        return this.cacheProperty(
            name,
            subnodes => subnodes ? subnodes.map(
                subnode => Node.typed(subnode)
            ) : subnodes
        );
    }
    /**
     * Like cacheNode, but includes cases where random other objects are present.
     * @param {string} name
     * @returns {Node|*}
     */
    cacheOptionalNode(name) {
        if(this.node[name] && this.node[name].kind) {
            return this.cacheNode(name)
        } else {
            return this.node[name]
        }
    }
    /**
     * Returns a cached copy of the named property, calling f(node_property)
     * if needed.
     * @param {string} name
     * @param {cachePropertyCallback} f
     * @returns {Object}
     */
    cacheProperty(name, f) {
        if(!this._cache.hasOwnProperty(name)) {
            this._cache[name] = f(this.node[name]);
        }
        return this._cache[name];
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        if(DEBUG) {
            if(this.loc) {
                console.info(`Checking ${context.fileContext.filename}:${this.loc.start.line}:${this.loc.start.column}:${this.kind}`)
            } else {
                console.info(`Checking ${context.fileContext.filename}:?:?:${this.kind}`)
            }
        }
        return new ContextTypes(PHPTypeUnion.empty)
    }
    /**
     * Converts PHPContextlessError into PHPStrictError, otherwise just rethrows.
     * @param {Error} e
     * @param {Context} context
     * @throws
     */
    handleException(e, context) {
        if(e instanceof PHPContextlessError) {
            // console.log(this.node)
            throw new PHPStrictError(
                e.message,
                context,
                this.loc
            )
        } else {
            throw e
        }
    }
    /**
     * Returns the shadow tree counterpart of the given node.
     * @param {ParserNode} node
     * @returns {Node}
     */
    static typed(node) {
        var c = ShadowTree[node.constructor.name];
        if(!c) {
            throw new Error(`No handler for ${node.constructor.name}`);
        }
        return new c(node);
    }
}

class Expression extends Node {
}
class Identifier extends Node {
    /** @type {string} */
    get name() {
        return this.node.name;
    }
    /**
     * @type {string} eg. "fqn"
     */
    get resolution() {
        return this.node.resolution;
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        return new ContextTypes(context.findName(this.name) || PHPTypeUnion.mixed)
    }
}
class Return extends Node {
    /** @type {?Expression} */
    get expr() {
        return this.cacheNode("expr")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        if(this.expr) {
            return new ContextTypes(
                PHPTypeUnion.empty,
                this.expr.check(context).expressionType
            )
        } else {
            return new ContextTypes(
                PHPTypeUnion.empty,
                PHPTypeUnion.empty
            )
        }
    }
}
class Statement extends Node {
}
class TraitUse extends Node {
    /** @type {?Node[]} */
    get adaptations() {
        return this.cacheNodeArray("adaptations")
    }
    /** @type {Identifier[]} */
    get traits() {
        return this.cacheNodeArray("traits")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        // TODO adaptations not yet supported
        if(this.traits) {
            this.traits.forEach(
                t => context.classContext.importTrait(
                    context.findClass(context.resolveNodeName(t))
                )
            )
        }
        return ContextTypes.empty
    }
}

class Assign extends Statement {
    /** @type {string} */
    get operator() {
        return this.node.operator;
    }
    /**
     * @type {Expression}
     */
    get left() {
        return this.cacheNode("left")
    }
    /** @type {Expression} */
    get right() {
        return this.cacheNode("right")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let left_context = context.childContext(true)
        left_context.assigningType = this.right.check(context).expressionType
        this.left.check(left_context)
        if(left_context.assigningType.isEmpty) {
            throw new PHPStrictError(
                `No value to assign`,
                context,
                this.node.loc
            )
        } else {
            return new ContextTypes(left_context.assigningType)
        }
    }
}
class Block extends Statement {
    /** @type {Node[]} */
    get children() {
        return this.cacheNodeArray("children");
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let types = PHPTypeUnion.empty
        this.children.forEach(node => {
            types = types.addTypesFrom(node.check(context).returnType)
        })
        return new ContextTypes(PHPTypeUnion.empty, types)
    }
}
class Call extends Statement {
    /**
     * @type {Object[]}
     */
    get arguments() {
        return this.cacheNodeArray("arguments")
    }
    /**
     * @type {Identifier|Variable|null}
     */
    get what() {
        return this.cacheNode("what")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let pbr_positions
        let callable_types = this.what.check(context, true).expressionType
        let callable_type = callable_types.types[0]
        if(callable_type instanceof PHPFunctionType) {
            pbr_positions = callable_type.passByReferencePositions
        } else {
            pbr_positions = {}
        }
        this.arguments.forEach((arg, i) => {
            if(pbr_positions[i]) {
                let inner_context = context.childContext(true)
                inner_context.assigningType = context.findName(arg.name) || PHPTypeUnion.mixed
                arg.check(inner_context)
            } else {
                arg.check(context)
            }
        })
        if(
            this.what instanceof Identifier &&
            this.what.name == "chdir"
        ) {
            if(this.arguments[0] instanceof _String) {
                context.chdir(this.arguments[0].value)
            } else if(
                this.arguments[0] instanceof Bin &&
                this.arguments[0].type == "." &&
                this.arguments[0].left instanceof Magic &&
                this.arguments[0].left.value == "__DIR__" &&
                this.arguments[0].right instanceof _String
            ) {
                context.chdir(context.fileContext.directory + this.arguments[0].right.value)
            }
        }
        let types = PHPTypeUnion.empty
        callable_types.types.forEach(t => {
            if(t instanceof PHPFunctionType) {
                types = types.addTypesFrom(t.returnType)
            } else {
                types = types.addTypesFrom(PHPTypeUnion.mixed)
            }
        })
        return new ContextTypes(types)
    }
}
class ConstRef extends Expression {
    /** @type {string|Identifier} */
    get name() {
        return this.cacheOptionalNode("name")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        if(this.name instanceof Identifier) {
            switch(this.name.name) {
                case "array":
                    return new ContextTypes(PHPSimpleType.named(this.name.name))
                default:
            }
            let constant_type = context.findName(this.name.name)
            if(constant_type) {
                return new ContextTypes(constant_type)
            }
            let constant_type_munged = context.findName(this.name.name.toUpperCase())
            if(constant_type_munged) {
                return new ContextTypes(constant_type_munged)
            }
        }
        let classContext = context.findClass(context.resolveNodeName(this))
        if(classContext) {
            return new ContextTypes(PHPSimpleType.named(classContext.name))
        } else {
            return new ContextTypes(PHPTypeUnion.mixed)
        }
    }
}
class Closure extends Statement {
    /** @type {Parameter[]} */
    get arguments() {
        return this.cacheNodeArray("arguments")
    }
    /** @type {?Block} */
    get body() {
        return this.cacheNode("body")
    }
    /** @type {boolean} */
    get byref() {
        return this.node.byref
    }
    /** @type {boolean} */
    get nullable() {
        return this.node.nullable
    }
    /** @type {Identifier} */
    get type() {
        return this.cacheNode("type")
    }
    /** @type {Variable[]} */
    get uses() {
        return this.cacheNodeArray("uses")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        var inner_context = context.childContext()
        let arg_types = []
        this.arguments.forEach(
            node => {
                let type_union
                if(node.type) {
                    type_union = PHPSimpleType.named(
                        context.resolveNodeName(node.type)
                    )
                } else {
                    type_union = PHPTypeUnion.mixed
                }
                if(node.nullable) {
                    type_union = type_union.addType(PHPSimpleType.types.null)
                }
                arg_types.push(inner_context.addName(
                    "$" + node.name,
                    type_union
                ))
            }
        )
        this.uses.forEach(
            t => inner_context.addName(
                '$' + t.name,
                t.byref ?
                    (context.findName('$' + t.name) || PHPTypeUnion.mixed) :
                    this.assertHasName(context, '$' + t.name)
            )
        )
        if(context.findName("$this")) {
            inner_context.addName("$this", context.findName("$this"))
        }
        let return_type
        if(this.body) {
            return_type = this.body.check(inner_context)
        } else {
            return_type = PHPTypeUnion.mixed
        }
        let types = new PHPFunctionType(arg_types, return_type)
        return new ContextTypes(types)
    }
}
class Declaration extends Statement {
    /** @type {string} */
    get name() {
        return this.node.name
    }
}
class Literal extends Expression {
    /** @type {Node|string|number|boolean|null} */
    get value() {
        return this.cacheOptionalNode("value")
    }
}
class Lookup extends Expression {
    /** @type {Expression} */
    get what() {
        return this.cacheNode("what")
    }
    /** @type {?Expression} */
    get offset() {
        return this.cacheNode("offset")
    }
}
class Sys extends Statement {
    /** @type {Node[]} */
    get arguments() {
        if(
            this.node.arguments instanceof Array ||
            !this.node.arguments
        ) {
            return this.cacheNodeArray("arguments")
        } else {
            return [this.cacheNode("arguments")] // TODO
        }
    }
}
class Variable extends Expression {
    /** @type {boolean} */
    get byref() {
        return this.node.byref;
    }
    /** @type {string|Node} */
    get name() {
        return this.cacheOptionalNode("name")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        if(context.assigningType) {
            return new ContextTypes(context.setName(
                '$' + this.name,
                context.assigningType
            ))
        } else {
            return new ContextTypes(this.assertHasName(context, '$' + this.name))
        }
    }
}
class Class extends Declaration {
    /**
     * @type {Declaration[]}
     */
    get body() {
        return this.cacheNodeArray("body")
    }
    /**
     * @type {?Identifier}
     */
    get extends() {
        return this.cacheNode("extends")
    }
    /**
     * @type {Identifier[]}
     */
    get implements() {
        return this.cacheNode("implements")
    }
    /**
     * @type {boolean}
     */
    get isAbstract() {
        return this.node.isAbstract
    }
    /**
     * @type {boolean}
     */
    get isAnonymous() {
        return this.node.isAnonymous
    }
    /**
     * @type {boolean}
     */
    get isFinal() {
        return this.node.isFinal
    }

    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let inner_context = context.childContext()
        inner_context.classContext = inner_context.globalContext.addClass(
            context.resolveNodeName(this),
            this.extends ?
                context.findClass(context.resolveNodeName(this.extends)) :
                null
        )
        inner_context.addName(
            "$this",
            PHPSimpleType.named(context.resolveNodeName(this))
        )
        this.body.forEach(
            b => {
                if(b instanceof Method) {
                    inner_context.classContext.addIdentifier(
                        b.name,
                        b.visibility,
                        b.isStatic,
                        PHPTypeUnion.mixedFunction
                    )
                } else if(b instanceof Property) {
                    inner_context.classContext.addIdentifier(
                        b.name,
                        b.visibility,
                        b.isStatic,
                        PHPTypeUnion.mixed
                    )
                } else if(b instanceof ClassConstant) {
                    inner_context.classContext.addIdentifier(
                        b.name,
                        "public",
                        true,
                        PHPTypeUnion.mixed
                    )
                } else if(b instanceof TraitUse) {
                    // Do nothing - loaded shortly
                }
            }
        )
        this.body.forEach(
            b => b.check(inner_context)
        )
        return ContextTypes.empty
    }
}
class Echo extends Sys {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.arguments.forEach(child => {
            let types = child.check(context)
        })
        return ContextTypes.empty
    }
}
class _Function extends Declaration {
    /** @type {Parameter[]} */
    get arguments() {
        return this.cacheNodeArray("arguments")
    }
    /** @type {?Block} */
    get body() {
        return this.cacheNode("body")
    }
    /** @type {boolean} */
    get byref() {
        return this.node.byref
    }
    /** @type {boolean} */
    get nullable() {
        return this.node.nullable
    }
    /** @type {Array[]} */
    get type() {
        return this.node.type
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        var inner_context = context.childContext()

        let arg_types = []
        let pass_by_reference_positions = {}
        this.arguments.forEach(
            (node, index) => {
                let type_union
                if(node.type) {
                    type_union = PHPSimpleType.named(
                        context.resolveNodeName(node.type)
                    )
                } else {
                    type_union = PHPTypeUnion.mixed
                }
                if(node.nullable) {
                    type_union.addType(PHPSimpleType.types.null)
                }
                arg_types.push(inner_context.addName(
                    "$" + node.name,
                    type_union
                ))
                if(node.byref) {
                    pass_by_reference_positions[index] = true
                }
            }
        )
        if(context.findName("$this")) {
            inner_context.addName("$this", context.findName("$this"))
        }

        let return_type
        if(this.body) {
            return_type = this.body.check(inner_context).returnType
        } else {
            return_type = PHPTypeUnion.mixed
        }
        let types = new PHPFunctionType(
            arg_types,
            return_type,
            pass_by_reference_positions
        ).union
        if(this.constructor === _Function) {
            context.addName(this.name, types)
        }
        return new ContextTypes(types) // Special case
    }
}
class Method extends _Function {
    /** @type {boolean} */
    get isAbstract() {
        return this.node.isAbstract
    }
    /** @type {boolean} */
    get isFinal() {
        return this.node.isFinal
    }
    /** @type {boolean} */
    get isStatic() {
        return this.node.isStatic
    }
    /** @type {string} */
    get visibility() {
        return this.node.visibility
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        let method_type = super.check(context).expressionType
        context.classContext.addIdentifier(
            this.name,
            this.visibility,
            this.isStatic,
            method_type
        )

        return ContextTypes.empty
    }
}
class _Number extends Literal {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let types = PHPSimpleType.types.number
        return new ContextTypes(types)
    }
}
class Parameter extends Declaration {
    /** @type {boolean} */
    get byref() {
        return this.node.byref
    }
    /** @type {boolean} */
    get nullable() {
        return this.node.nullable
    }
    /** @type {Identifier} */
    get type() {
        return this.cacheNode("type")
    }
    /** @type {?Node} */
    get value() {
        return this.cacheNode("value")
    }
    /** @type {boolean} */
    get variadic() {
        return this.node.variadic
    }
}
class Program extends Block {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        var inner_context = context.childContext();
        this.children.forEach(child => child.check(inner_context));
        return super.check(context);
    }
}
class PropertyLookup extends Lookup {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {boolean} [in_call]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        if(
            (
                this.what instanceof Variable ||
                this.what instanceof PropertyLookup ||
                this.what instanceof StaticLookup ||
                this.what instanceof OffsetLookup ||
                this.what instanceof Parenthesis
             ) &&
            this.offset instanceof ConstRef
        ) {
            let inner_context = context.childContext(true)
            inner_context.assigningType = null
            let type_union = this.what.check(inner_context).expressionType
            let types_out = PHPTypeUnion.empty
            try {
                type_union.types.forEach(t => {
                    let class_context = context.findClass("" + t)
                    let identifier_types = class_context.findInstanceIdentifier(this.offset.name, context.classContext, in_call)
                    if(identifier_types) {
                        types_out = types_out.addTypesFrom(identifier_types)
                    } else {
                        throw new PHPStrictError(
                            `No accessible identifier ${t}->${this.offset.name}\n` +
                            `Accessible properties are: ${Object.keys(class_context.instanceIdentifiers)}`,
                            context,
                            this.loc
                        )
                    }
                })
            } catch(e) {
                this.handleException(e, context)
            }
            return new ContextTypes(types_out)
        } else if(
            this.what instanceof Call &&
            this.offset instanceof ConstRef
        ) {
            let type_union = this.what.check(context).expressionType
            let types_in = PHPTypeUnion.empty
            type_union.types.forEach(t => {
                if(t instanceof PHPFunctionType) {
                    types_in = types_in.addType(t.returnType)
                } else {
                    types_in = types_in.addTypesFrom(PHPTypeUnion.mixed)
                }
            })
            let types_out = PHPTypeUnion.empty
            try {
                types_in.types.forEach(t => {
                    let class_context = context.findClass("" + t)
                    let identifier_types = class_context.findInstanceIdentifier(this.offset.name, context.classContext, in_call)
                    if(identifier_types) {
                        types_out = types_out.addTypesFrom(identifier_types)
                    } else {
                        throw new PHPStrictError(
                            `No accessible identifier ${t}->${this.offset.name}\n` +
                            `Accessible properties are: ${Object.keys(class_context.instanceIdentifiers)}`,
                            context,
                            this.loc
                        )
                    }
                })
            } catch(e) {
                this.handleException(e, context)
            }
            return new ContextTypes(types_out)
        } else if(
            this.what instanceof Call &&
            this.offset instanceof _String
        ) {
            let type_union = this.what.check(context).expressionType
            let types_in = PHPTypeUnion.empty
            type_union.types.forEach(t => {
                if(t instanceof PHPFunctionType) {
                    types_in = types_in.addType(t.returnType)
                } else {
                    types_in = types_in.addTypesFrom(PHPTypeUnion.mixed)
                }
            })
            let types_out = PHPTypeUnion.empty
            try {
                types_in.types.forEach(t => {
                    let class_context = context.findClass("" + t)
                    let identifier_types = class_context.findInstanceIdentifier(this.offset.value, context.classContext, in_call)
                    if(identifier_types) {
                        types_out = types_out.addTypesFrom(identifier_types)
                    } else {
                        throw new PHPStrictError(
                            `No accessible identifier ${t}->${this.offset.value}\n` +
                            `Accessible properties are: ${Object.keys(class_context.instanceIdentifiers)}`,
                            context,
                            this.loc
                        )
                    }
                })
            } catch(e) {
                this.handleException(e, context)
            }
            return new ContextTypes(types_out)
        } else if(this.offset instanceof Variable) {
            return new ContextTypes(PHPTypeUnion.mixed)
        } else {
            console.log(this.node)
            console.log("TODO don't know how to check this kind of lookup")
        }
        return new ContextTypes(PHPTypeUnion.mixed)
    }
}
class StaticLookup extends Lookup {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        if(this.what instanceof Variable) {
            this.what.check(context)
            //this.offset.check(context)
            return new ContextTypes(PHPTypeUnion.mixed)
        } else if(
            (
                this.what instanceof Identifier ||
                this.what instanceof ConstRef
            ) &&
            this.offset instanceof ConstRef
        ) {
            let resolved_name
            try {
                resolved_name = context.resolveNodeName(this.what)
            } catch(e) {
                this.handleException(e, context)
            }
            let class_context
            try {
                class_context = context.findClass(resolved_name)
            } catch(e) {
                this.handleException(e, context)
            }
            if(class_context) {
                let types
                if(
                    context.classContext &&
                    context.classContext.isSubclassOf(class_context) &&
                    context.findName("$this")
                ) {
                    // TODO this doesn't distinguish between methods and constants
                    types = class_context.findInstanceIdentifier(this.offset.name, context.classContext)
                    if(!types) {
                        types = class_context.findStaticIdentifier(this.offset.name, context.classContext)
                    }
                } else {
                    types = class_context.findStaticIdentifier(this.offset.name, context.classContext)
                }
                if(types) {
                    return new ContextTypes(types)
                } else if(this.what.name == "static") {
                    PHPStrictError.warn(
                        `Undeclared static property static::${this.offset.name}`,
                        context,
                        this.node.loc
                    )
                    class_context.addIdentifier(
                        this.offset.name,
                        "public",
                        true,
                        PHPTypeUnion.mixed
                    )
                    return new ContextTypes(PHPTypeUnion.mixed)
                } else {
                    throw new PHPStrictError(
                        `No accessible identifier ${resolved_name}::${this.offset.name}`,
                        context,
                        this.loc
                    )
                }
            }
        } else if(
            (
                this.what instanceof Identifier ||
                this.what instanceof ConstRef
            ) &&
            (
                this.offset instanceof OffsetLookup ||
                this.offset instanceof Variable
            )
        ) {
            // Bar::$FOO
            // TODO
            //this.offset.check(context)
            return new ContextTypes(PHPTypeUnion.mixed)
        } else {
            console.log(this.node)
            console.log("TODO don't know how to check this kind of lookup")
        }
        return ContextTypes.empty
    }
}
class _String extends Literal {
    /** @type {string} */
    get label() {
        return this.node.label
    }
    /** @type {string} */
    get value() {
        return this.node.value
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let types = PHPSimpleType.types.string
        return new ContextTypes(types)
    }
}
class Constant extends Declaration {
    /** @type {?Node} */
    get value() {
        return this.cacheNode("value")
    }

    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let types
        if(this.value) {
            types = this.value.check(context)
        } else {
            types = PHPTypeUnion.mixed
        }
        context.classContext.addIdentifier(this.name, "public", true, types)
        return ContextTypes.empty
    }
}
class Operation extends Expression {
}
class _Array extends Expression {
     /** @type {Entry[]} */
     get items() {
         return this.cacheNodeArray("items")
     }
     /** @type {boolean} */
     get shortForm() {
         return this.node.shortForm
     }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        if(this.items) {
            this.items.forEach(
                item => item.check(context)
            )
        }
        return new ContextTypes(PHPSimpleType.types.array)
    }
}
class Bin extends Operation {
    /** @type {string} */
    get type() {
        return this.node.type
    }
    /** @type {Expression} */
    get left() {
        return this.cacheNode("left")
    }
    /** @type {Expression} */
    get right() {
        return this.cacheNode("right")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let left_types = this.left.check(context).expressionType
        let right_types = this.right.check(context).expressionType
        let types = PHPTypeUnion.empty
        switch(this.type) {
            case "||":
            case "|":
            case "&":
            case "&&":
            case "and":
            case "or":
                types = types.addType(PHPSimpleType.types.boolean)
                break
            case "*":
            case "/":
            case "-":
            case "%":
            case "**":
            case "<<":
            case ">>":
            case "^":
                types = types.addType(PHPSimpleType.types.number)
                break
            case "+":
                if(left_types.types.length == 1 && "" + left_types[0] == "array") {
                    types = types.addTypesFrom(left_types)
                } else {
                    types = types.addType(PHPSimpleType.types.number)
                }
                break
            case ".":
                types = types.addType(PHPSimpleType.types.string)
                break
            case "~":
            case "!~":
            case "=":
            case "!=":
            case "?":
            case "<":
            case "<=":
            case ">":
            case "=>":
            case ">=":
            case "==":
            case "!==":
            case "===":
            case "instanceof":
                types = types.addType(PHPSimpleType.types.boolean)
                break
            default:
                console.log(this.node)
                console.log(`Don't know how to parse operator type ${this.type}`)
                types = types.addTypesFrom(left_types)
                types = types.addTypesFrom(right_types)
        }
        return new ContextTypes(types)
    }
}
class _Boolean extends Literal {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        return new ContextTypes(PHPSimpleType.types.boolean)
    }
}
class Break extends Node {
    /** @type {?Number} */
    get level() {
        return this.cacheNode("level")
    }
}
class Case extends Node {
    /** @type {?Expression} */
    get test() {
        return this.cacheNode("test")
    }
    /** @type {?Block} */
    get body() {
        return this.cacheNode("body")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        if(this.test) {
            this.test.check(context)
        }
        if(this.body) {
            return this.body.check(context)
        } else {
            return ContextTypes.empty
        }
    }
}
class Cast extends Operation {
    /** @type {string} */
    get type() {
        return this.node.type
    }
    /** @type {Expression} */
    get what() {
        return this.cacheNode("what")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.what.check(context)
        return new ContextTypes(PHPSimpleType.named(this.type))
    }
}
class Catch extends Statement {
    /** @type {Identifier[]} */
    get what() {
        return this.cacheNodeArray("what")
    }
    /** @type {Variable} */
    get variable() {
        return this.cacheNode("variable")
    }
    /** @type {Statement} */
    get body() {
        return this.cacheNode("body")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let types = PHPTypeUnion.empty
        this.what.forEach(
            w => types = types.addType(PHPSimpleType.named(w.name))
        )
        let inner_context = context.childContext(true)
        inner_context.assigningType = PHPTypeUnion.mixed
        this.variable.check(inner_context)
        this.body.check(context)
        return ContextTypes.empty
    }
}
class ClassConstant extends Constant {
    /** @type {boolean} */
    get isStatic() {
        return this.node.isStatic
    }
    /** @type {string} */
    get visibility() {
        return this.node.visibility
    }
}
class Clone extends Statement {
    /** @type {Expression} */
    get what() {
        return this.cacheNode("what")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        return this.what.check(context)
    }
}
class Coalesce extends Operation {
    /** @type {Expression} */
    get test() {
        return this.cacheNode("test")
    }
    /** @type {Expression} */
    get ifnull() {
        return this.cacheNode("ifnull")
    }
}
class Continue extends Node {
    /** @type {?Number} */
    get level() {
        return this.cacheNode("level")
    }
}
class Declare extends Block {
    /** @type {Expression[]} */
    get what() {
        return this.cacheNodeArray("what")
    }
    /** @type {string} */
    get mode() {
        return this.node.mode
    }
}
class Do extends Statement {
    /** @type {Expression} */
    get test() {
        return this.cacheNode("test")
    }
    /** @type {Statement} */
    get body() {
        return this.cacheNode("body")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.body.check(context)
        this.test.check(context)
        return ContextTypes.empty
    }
}
class Doc extends Node {
    /** @type {boolean} */
    get isDoc() {
        return this.node.isDoc
    }
    /** @type {string[]} */
    get lines() {
        return this.node.lines
    }
}
class Empty extends Sys {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.arguments.forEach(
            a => a.check(context)
        )
        return ContextTypes.empty // FIXME?
    }
}
class Encapsed extends Literal {
    /** @type {string} */
    get type() {
        return this.node.type
    }
    /** @type {?string} */
    get label() {
        return this.node.label
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        return new ContextTypes(PHPSimpleType.types.string)
    }
}
class Entry extends Node {
    /** @type {?Node} */
    get key() {
        return this.cacheNode("key")
    }
    /** @type {Node} */
    get value() {
        return this.cacheNode("value")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        if(this.key) {
            this.key.check(context)
        }
        this.value.check(context)
        return ContextTypes.empty
    }
}
class Eval extends Statement {
    /** @type {Node} */
    get source() {
        return this.cacheNode("source")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.source.check(context)
        return new ContextTypes(PHPTypeUnion.mixed)
    }
}
class Exit extends Statement {
    /** @type {?Node} */
    get status() {
        return this.cacheNode("status")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        if(this.status) {
            this.status.check(context)
        }
        return ContextTypes.empty
    }
}
class For extends Statement {
    /** @type {Expression[]} */
    get init() {
        return this.cacheNodeArray("init")
    }
    /** @type {Expression[]} */
    get test() {
        return this.cacheNodeArray("test")
    }
    /** @type {Expression[]} */
    get increment() {
        return this.cacheNodeArray("increment")
    }
    /** @type {Statement} */
    get body() {
        return this.cacheNode("body")
    }
    /** @type {boolean} */
    get shortForm() {
        return this.node.shortForm
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.init.forEach(
            n => n.check(context)
        )
        this.test.forEach(
            n => n.check(context)
        )
        this.increment.forEach(
            n => n.check(context)
        )
        this.body.check(context)
        return ContextTypes.empty
    }
}
class Foreach extends Statement {
    /** @type {Expression} */
    get source() {
        return this.cacheNode("source")
    }
    /** @type {?Expression} */
    get key() {
        return this.cacheNode("key")
    }
    /** @type {Expression} */
    get value() {
        return this.cacheNode("value")
    }
    /** @type {Statement} */
    get body() {
        return this.cacheNode("body")
    }
    /** @type {boolean} */
    get shortForm() {
        return this.node.shortForm
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.source.check(context)
        let assign_context = context.childContext(true)
        assign_context.assigningType = PHPTypeUnion.mixed
        if(this.key) {
            this.key.check(assign_context)
        }
        this.value.check(assign_context)
        this.body.check(context)
        return ContextTypes.empty
    }
}
class Global extends Statement {
    /** @type {Variable[]} */
    get items() {
        return this.cacheNodeArray("items")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let inner_context = context.childContext(true)
        inner_context.assigningType = PHPTypeUnion.mixed
        this.items.forEach(item => item.check(inner_context))
        return ContextTypes.empty
    }
}
class Goto extends Statement {
    /** @type {string} */
    get label() {
        return this.node.label
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        throw new PHPStrictError(
            "Use of goto",
            context,
            this.loc
        )
    }
}
class Halt extends Statement {
    /** @type {string} */
    get after() {
        return this.node.after
    }
    // No check required - AST parser should have already halted here.
}
class If extends Statement {
    /** @type {Expression} */
    get test() {
        return this.cacheNode("test")
    }
    /** @type {Block} */
    get body() {
        return this.cacheNode("body")
    }
    /** @type {Block|If|null} */
    get alternate() {
        return this.cacheNode("alternate")
    }
    /** @type {boolean} */
    get shortForm() {
        return this.node.shortForm
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.test.check(context)

        let body_context = context.childContext(false)
        body_context.importNamespaceFrom(context)
        let type = PHPTypeUnion.empty
        type = type.addTypesFrom(this.body.check(body_context).returnType)
        if(this.alternate) {
            let alt_context = context.childContext(false)
            alt_context.importNamespaceFrom(context)
            type = type.addTypesFrom(this.alternate.check(alt_context).returnType)
            context.importNamespaceFrom(alt_context)
        }
        context.importNamespaceFrom(body_context)
        return new ContextTypes(PHPTypeUnion.empty, type)
    }
}
class Include extends Statement {
    /** @type {Expression} */
    get target() {
        return this.cacheNode("target")
    }
    /** @type {boolean} */
    get once() {
        return this.node.once
    }
    /** @type {boolean} */
    get require() {
        return this.node.require
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.target.check(context)
        if(this.target instanceof _String) {
            context.checkFile(this.target.value, this.require)
        }
        return ContextTypes.empty
    }
}
class Inline extends Literal {
    // No check needed - this is the gap between '?>' and the next '<?php'
}
class Interface extends Declaration {
    /** @type {?Identifier} */
    get extends() {
        let e = this.cacheNodeArray("extends")
        return e && e[0]
    }
    /** @type {Declaration[]} */
    get body() {
        return this.cacheNodeArray("body")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let inner_context = context.childContext()
        inner_context.classContext = inner_context.globalContext.addInterface(
            context.resolveNodeName(this),
            this.extends ?
                context.findClass(context.resolveNodeName(this.extends)) :
                null
        )
        this.body.forEach(
            b => {
                if(b instanceof Method) {
                    inner_context.classContext.addIdentifier(
                        b.name,
                        b.visibility,
                        b.isStatic,
                        PHPTypeUnion.mixedFunction
                    )
                }
            }
        )
        this.body.forEach(
            b => b.check(inner_context)
        )
        return ContextTypes.empty
    }
}
class Isset extends Sys {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        // no-op
        return new ContextTypes(PHPSimpleType.types.boolean)
    }
}
class Label extends Node {
    /** @type {string} */
    get name() {
        return this.node.name
    }
}
class List extends Sys {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        if(context.assigningType) {
            this.arguments.forEach(
                arg => {
                    let inner_context = context.childContext(true)
                    inner_context.assigningType = PHPTypeUnion.mixed
                    arg.check(inner_context)
                }
            )
            return ContextTypes.empty
        } else {
            return super.check(context)
        }
    }
}
class Magic extends Literal {
}
class Namespace extends Block {
    /** @type {string} */
    get name() {
        return this.node.name
    }
    /** @type {Boolean} */
    get withBrackets() {
        return this.node.withBrackets
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        context.fileContext.namespace = this.name
        super.check(context)
        return ContextTypes.empty
    }
}
class New extends Statement {
    /** @type {Identifier|Variable|Class} */
    get what() {
        return this.cacheNode("what")
    }
    /** @type {Node[]} */
    get arguments() {
        return this.cacheNodeArray("arguments")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.arguments.forEach(
            arg => arg.check(context)
        )
        if(this.what instanceof Variable) {
            return new ContextTypes(PHPTypeUnion.mixed)
        } else {
            return new ContextTypes(PHPSimpleType.named(
                context.resolveNodeName(this.what)
            ))
        }
    }
}
class Nowdoc extends Literal {
    /** @type {string} */
    get label() {
        return this.node.label
    }
}
class OffsetLookup extends Lookup {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {boolean} [in_call]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let types_in
        if(
            this.what instanceof Variable ||
            this.what instanceof PropertyLookup ||
            this.what instanceof StaticLookup ||
            this.what instanceof OffsetLookup ||
            this.what instanceof Parenthesis
        ) {
            let inner_context = context.childContext(true)
            inner_context.assigningType = null
            types_in = this.what.check(inner_context)
        } else if(
            this.what instanceof Call
        ) {
            let type_union = this.what.check(context).expressionType
            types_in = PHPTypeUnion.empty
            type_union.types.forEach(t => {
                if(t instanceof PHPFunctionType) {
                    types_in = types_in.addType(t.returnType)
                } else {
                    types_in = types_in.addTypesFrom(PHPTypeUnion.mixed)
                }
            })
        } else {
            console.log(this.node)
            console.log("TODO don't know how to check this kind of lookup")
            return new ContextTypes(PHPTypeUnion.mixed)
        }
        if(this.offset instanceof Variable) {
            return new ContextTypes(PHPTypeUnion.mixed)
        } else {
            return new ContextTypes(PHPTypeUnion.mixed) // TODO improve
        }
    }
}
class Parenthesis extends Operation {
    /** @type {Expression} */
    get inner() {
        return this.cacheNode("inner")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        return this.inner.check(context)
    }
}
class Post extends Operation {
    /** @type {string} */
    get type() {
        return this.node.type
    }
    /** @type {Variable} */
    get what() {
        return this.cacheNode("what")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        return this.what.check(context)
    }
}
class Pre extends Operation {
    /** @type {string} */
    get type() {
        return this.node.type
    }
    /** @type {Variable} */
    get what() {
        return this.cacheNode("what")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        return this.what.check(context)
    }
}
class Print extends Sys {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.arguments.forEach(
            a => a.check(context)
        )
        return ContextTypes.empty
    }
}
class Property extends Declaration {
    /** @type {boolean} */
    get isFinal() {
        return this.node.isFinal
    }
    /** @type {boolean} */
    get isStatic() {
        return this.node.isStatic
    }
    /** @type {string} */
    get visibility() {
        return this.node.visibility
    }
    /** @type {?Node} */
    get value() {
        return this.cacheNode("value")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        context.classContext.addIdentifier(
            this.name,
            this.visibility,
            this.isStatic,
            this.value ? this.value.check(context).expressionType : PHPTypeUnion.mixed
        )
        return ContextTypes.empty
    }
}
class RetIf extends Statement {
    /** @type {Expression} */
    get test() {
        return this.cacheNode("test")
    }
    /** @type {Expression} */
    get trueExpr() {
        return this.cacheNode("trueExpr")
    }
    /** @type {Expression} */
    get falseExpr() {
        return this.cacheNode("falseExpr")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let test_type = this.test.check(context).expressionType
        let types = PHPTypeUnion.empty
        if(this.trueExpr) {
            types = types.addTypesFrom(this.trueExpr.check(context).expressionType)
        } else {
            types = types.addTypesFrom(test_type)
        }
        types = types.addTypesFrom(this.falseExpr.check(context).expressionType)
        return new ContextTypes(types)
    }
}
class Shell extends Literal {
}
class Silent extends Statement {
    /** @type {Expression} */
    get expr() {
        return this.cacheNode("expr")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        return this.expr.check(context)
    }
}
class Static extends Statement {
    /** @type {(Variable|Assign)[]} */
    get items() {
        return this.cacheNodeArray("items")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let inner_context = context.childContext(true)
        inner_context.assigningType = PHPTypeUnion.mixed
        this.items.forEach(
            i => i.check(inner_context)
        )
        return ContextTypes.empty
    }
}
class Switch extends Statement {
    /** @type {Expression} */
    get test() {
        return this.cacheNode("test")
    }
    /** @type {Block} */
    get body() {
        return this.cacheNode("body")
    }
    /** @type {boolean} */
    get shortForm() {
        return this.node.shortForm
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.test.check(context)
        return this.body.check(context)
    }
}
class Throw extends Statement {
    /** @type {Expression} */
    get what() {
        return this.cacheNode("what")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.what.check(context)
        return ContextTypes.empty
    }
}
class Trait extends Declaration {
    /** @type {?Identifier} */
    get extends() {
        return this.cacheNode("extends")
    }
    /** @type {Identifier[]} */
    get implements() {
        return this.cacheNodeArray("implements")
    }
    /** @type {Declaration[]} */
    get body() {
        return this.cacheNodeArray("body")
    }

    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let inner_context = context.childContext()
        inner_context.classContext = inner_context.globalContext.addTrait(
            context.resolveNodeName(this),
            this.extends ?
                context.findClass(context.resolveNodeName(this.extends)) :
                null
        )
        inner_context.addName(
            "$this",
            PHPSimpleType.named(context.resolveNodeName(this))
        )
        this.body.forEach(
            b => {
                if(b instanceof Method) {
                    inner_context.classContext.addIdentifier(
                        b.name,
                        b.visibility,
                        b.isStatic,
                        PHPTypeUnion.mixedFunction
                    )
                }
            }
        )
        this.body.forEach(
            b => b.check(inner_context)
        )
        return ContextTypes.empty
    }
}
class TraitAlias extends Node {
    /** @type {?Identifier} */
    get trait() {
        return this.cacheNode("trait")
    }
    /** @type {string} */
    get method() {
        return this.node.method
    }
    /** @type {?string} */
    get as() {
        return this.cacheNode("as")
    }
    /** @type {?string} */
    get visibility() {
        return this.cacheNode("visibility")
    }
}
class TraitPrecedence extends Node {
    /** @type {?Identifier} */
    get trait() {
        return this.cacheNode("trait")
    }
    /** @type {string} */
    get method() {
        return this.node.method
    }
    /** @type {Identifier[]} */
    get instead() {
        return this.cacheNodeArray("instead")
    }
}
class Try extends Statement {
    /** @type {Block} */
    get body() {
        return this.cacheNode("body")
    }
    /** @type {Catch[]} */
    get catches() {
        return this.cacheNodeArray("catches")
    }
    /** @type {?Block} */
    get always() {
        return this.cacheNode("always")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.body.check(context)
        this.catches.forEach(
            c => c.check(context)
        )
        if(this.always) {
            this.always.check(context)
        }
        return ContextTypes.empty
    }
}
class Unary extends Operation {
    /** @type {string} */
    get type() {
        return this.node.type
    }
    /** @type {Expression} */
    get what() {
        return this.cacheNode("what")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        return this.what.check(context)
    }
}
class Unset extends Sys {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        // More or less no-op
        return ContextTypes.empty
    }
}
class UseGroup extends Statement {
    /** @type {?Identifier} */
    get name() {
        return this.cacheNode("name")
    }
    /** @type {?string} */
    get type() {
        return this.node.type
    }
    /** @type {UseItem[]} */
    get items() {
        return this.cacheNodeArray("items")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.items.forEach(
            item => item.check(context)
        )
        // More or less no-op
        return ContextTypes.empty
    }
}
class UseItem extends Statement {
    /** @type {string} */
    get name() {
        return this.node.name
    }
    /** @type {?string} */
    get type() {
        return this.node.type
    }
    /** @type {?string} */
    get alias() {
        return this.node.alias
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        var local_alias = this.alias || this.name.replace(/.*\\/, "")
        context.fileContext.alias(this.name, local_alias)
        return ContextTypes.empty
    }
}
class Variadic extends Expression {
    /** @type {Array|Expression} */
    get what() {
        return this.cacheNode("what")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.what.check(context)
        return ContextTypes.empty
    }
}
class While extends Statement {
    /** @type {Expression} */
    get test() {
        return this.cacheNode("test")
    }
    /** @type {Statement} */
    get body() {
        return this.cacheNode("body")
    }
    /** @type {boolean} */
    get shortForm() {
        return this.node.shortForm
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        this.test.check(context)
        this.body.check(context)
        return ContextTypes.empty
    }
}
class Yield extends Expression {
    /** @type {?Expression} */
    get value() {
        return this.cacheNode("value")
    }
    /** @type {?Expression} */
    get key() {
        return this.cacheNode("key")
    }
}
class YieldFrom extends Expression {
    /** @type {Expression} */
    get value() {
        return this.cacheNode("value")
    }
}
const ShadowTree = {
    Array: _Array,
    Assign: Assign,
    Bin: Bin,
    Block: Block,
    Bool: Bin,
    Boolean: _Boolean,
    Break: Break,
    Call: Call,
    Case: Case,
    Cast: Cast,
    Catch: Catch,
    Class: Class,
    ClassConstant: ClassConstant,
    Clone: Clone,
    Closure: Closure,
    Coalesce: Coalesce,
    ConstRef: ConstRef,
    Constant: Constant,
    Continue: Continue,
    Declaration: Declaration,
    Declare: Declare,
    Do: Do,
    Doc: Doc,
    Echo: Echo,
    Empty: Empty,
    Encapsed: Encapsed,
    Entry: Entry,
    Eval: Eval,
    Exit: Exit,
    Expression: Expression,
    For: For,
    Foreach: Foreach,
    Global: Global,
    Goto: Goto,
    Halt: Halt,
    Identifier: Identifier,
    If: If,
    Include: Include,
    Inline: Inline,
    Interface: Interface,
    Isset: Isset,
    Label: Label,
    List: List,
    Literal: Literal,
    Magic: Magic,
    Method: Method,
    Namespace: Namespace,
    New: New,
    Node: Node,
    Nowdoc: Nowdoc,
    Number: _Number,
    OffsetLookup: OffsetLookup,
    Operation: Operation,
    Parameter: Parameter,
    Parenthesis: Parenthesis,
    Post: Post,
    Pre: Pre,
    Print: Print,
    Program: Program,
    Property: Property,
    PropertyLookup: PropertyLookup,
    RetIf: RetIf,
    Return: Return,
    Shell: Shell,
    Silent: Silent,
    Statement: Statement,
    Static: Static,
    StaticLookup: StaticLookup,
    String: _String,
    Switch: Switch,
    Sys: Sys,
    Throw: Throw,
    Trait: Trait,
    TraitAlias: TraitAlias,
    TraitPrecedence: TraitPrecedence,
    TraitUse: TraitUse,
    Try: Try,
    Unary: Unary,
    Unset: Unset,
    UseGroup: UseGroup,
    UseItem: UseItem,
    Variable: Variable,
    Variadic: Variadic,
    While: While,
    Yield: Yield,
    YieldFrom: YieldFrom,
    _Function: _Function,
}
export default ShadowTree
export {Class, Identifier, ConstRef}