import PHPStrictError from "./phpstricterror"
import Context from "./context"
import {PHPFunctionType, PHPSimpleType} from "./phptype"

/**
 * @typedef ParserNode
 * @property {function} constructor
 * @property {string} kind
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

class Node {
    constructor(node) {
        Object.assign(
            this,
            {
                _cache: {},
                node: node
            }
        );
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
     * @returns {?PHPType[]}
     */
    assertHasName(context, name) {
        var types = context.findName(name)
        if(!types) {
            throw new PHPStrictError(
                `Name ${name} is not defined in this namespace, contents are: ${Object.keys(context.ns)}`
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
     * @param {function} f
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
     * @returns {?PHPType[]} The set of types applicable to this value
     */
    check(context) {
        return []
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
     * The fully resolved name
     * @param {Context} context
     * @returns {string}
     */
    resolvedName(context) {
        switch(this.resolution) {
            case "fqn":
                return this.name
            case "uqn":
                return "\\" + this.name // TODO namespaces
            default:
                console.log(this.node)
                console.log("TODO don't know how to resolve")
        }
    }
}
class Return extends Node {
    /** @type {?Expression} */
    get expr() {
        return this.cacheNode("expr")
    }
}
class Statement extends Node {
}
class TraitUse extends Node {
    /** @type {Identifier[]} */
    get adaptations() {
        return this.cacheNodeArray("adaptations");
    }
    /** @type {?Node[]} */
    get traits() {
        if(this.node.traits) {
            return this.cacheNodeArray("traits");
        } else {
            return null;
        }
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
     * @returns {?PHPType[]} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        return context.addName(
            '$' + this.left.name,
            this.right.check(context)
        )
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
     * @returns {?PHPType[]} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        this.children.forEach(node => node.check(context))
        return []
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
     * @returns {?PHPType[]} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        this.arguments.forEach(arg => arg.check(context))
        let callable_types = this.what.check(context)
        console.log(callable_types)
        return []
    }
}
class ConstRef extends Expression {
    /** @type {Node|string} */
    get name() {
        return this.cacheOptionalNode("name")
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
    /** @type {Array[]} */
    get type() {
        return this.node.type
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?PHPType[]} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        var inner_context = context.childContext()
        let arg_types = []
        this.arguments.forEach(
            node => arg_types.push(inner_context.addName(
                '$' + node.name,
                (node.type ? [node.type.name] : []).concat(
                    node.nullable ? ["null"] : []
                )
            ))
        )
        this.type.forEach(
            t => inner_context.addName(
                t[1],
                this.assertHasName(context, t[1])
            )
        )
        let return_type
        if(this.body) {
            return_type = this.body.check(inner_context)
        }
        return [new PHPFunctionType(arg_types, return_type)]
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
    /** @type {Expression} */
    get offset() {
        return this.cacheNode("offset")
    }
}
class Sys extends Statement {
    /** @type {Node[]} */
    get arguments() {
        return this.cacheNodeArray("arguments")
    }
}
class Variable extends Expression {
    /** @type {bool} */
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
     * @returns {?PHPType[]} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        return this.assertHasName(context, '$' + this.name)
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
     * The fully resolved name
     * @param {Context} context
     * @returns {string}
     */
    resolvedName(context) {
        return "\\" + this.name // FIXME
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?PHPType[]} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        let inner_context = context.childContext()
        inner_context.classContext = inner_context.globalContext.addClass(
            this.resolvedName(context)
        )
        this.body.forEach(
            b => b.check(inner_context)
        )
        return []
    }
}
class Echo extends Sys {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?PHPType[]} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        this.arguments.forEach(child => {
            let types = child.check(context)
        })
        return []
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
    /** @type {bool} */
    get byref() {
        return this.node.byref
    }
    /** @type {bool} */
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
     * @returns {?PHPType[]} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        var inner_context = context.childContext()

        let arg_types = []
        this.arguments.forEach(
            node => arg_types.push(inner_context.addName(
                node.name,
                (node.type ? [node.type.name] : []).concat(
                    node.nullable ? ["null"] : []
                )
            ))
        )
        if(this.type) {
            this.type.forEach(
                t => inner_context.addName(
                    t[1],
                    this.assertHasName(context, t[1])
                )
            )
        }

        let return_type
        if(this.body) {
            return_type = this.body.check(inner_context)
        }
        return [new PHPFunctionType(arg_types, return_type)]
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
     * @returns {?PHPType[]} The set of types applicable to this value
     */
    check(context) {
        context.classContext.addIdentifier(
            this.name,
            this.visibility,
            this.isStatic,
            super.check(context)
        )
        return []
    }
}
class Number extends Literal {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?PHPType[]} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        return [new PHPSimpleType("number")]
    }
}
class Parameter extends Declaration {
    /** @type {bool} */
    get byref() {
        return this.node.byref
    }
    /** @type {bool} */
    get nullable() {
        return this.node.nullable
    }
    /** @type {Node} */
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
    /** @type {Error[]} */
    get errors() {
        return this.cacheNodeArray("errors")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?PHPType[]} The set of types applicable to this value
     */
    check(context) {
        var inner_context = context.childContext();
        this.children.forEach(child => child.check(inner_context));
        return super.check(context);
    }
}
class PropertyLookup extends Lookup {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?PHPType[]} The set of types applicable to this value
     */
    check(context) {
        return super.check(context)
    }
}
class StaticLookup extends Lookup {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?PHPType[]} The set of types applicable to this value
     */
    check(context) {
        if(
            this.what instanceof Identifier &&
            this.offset instanceof ConstRef
        ) {
            let resolved_name = this.what.resolvedName(context)
            let class_context = context.globalContext.findClass(resolved_name)
            if(class_context) {
                if(!class_context.findStaticIdentifier(this.offset.name, context.classContext)) {
                    throw new PHPStrictError(`No accessible method ${resolved_name}::${this.offset.name}`)
                }
            } else {
                console.log(`Unable to find class named ${resolved_name}`)
            }
        } else {
            console.log(this.node)
            console.log("TODO don't know how to check this kind of lookup")
        }
        return super.check(context)
    }
}
class String extends Literal {
    /** @type {string} */
    get label() {
        return this.node.label
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?PHPType[]} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        return [new PHPSimpleType("string")]
    }
}
const ShadowTree = {
    Assign: Assign,
    Block: Block,
    Call: Call,
    Class: Class,
    Closure: Closure,
    ConstRef: ConstRef,
    Declaration: Declaration,
    Echo: Echo,
    Expression: Expression,
    _Function: _Function,
    Identifier: Identifier,
    Literal: Literal,
    Method: Method,
    Node: Node,
    Number: Number,
    Parameter: Parameter,
    Program: Program,
    PropertyLookup: PropertyLookup,
    Return: Return,
    Statement: Statement,
    StaticLookup: StaticLookup,
    String: String,
    Sys: Sys,
    TraitUse: TraitUse,
    Variable: Variable,
}
export default ShadowTree