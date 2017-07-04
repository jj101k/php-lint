import PHPStrictError from "./phpstricterror"
import Context from "./context"
import {PHPFunctionType, PHPSimpleType, PHPTypeUnion} from "./phptype"

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
                `Name ${name} is not defined in this namespace, contents are: ${Object.keys(context.ns).join(", ")}`,
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
     * @returns {?PHPTypeUnion} The set of types applicable to this value
     */
    check(context) {
        return PHPTypeUnion.empty
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
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?PHPTypeUnion} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        if(this.expr) {
            return this.expr.check(context)
        } else {
            return new PHPTypeUnion(new PHPSimpleType("null"))
        }
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
     * @returns {?PHPTypeUnion} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        let left_context = context.childContext(true)
        left_context.isAssigning = this.right.check(context)
        this.left.check(left_context)
        return left_context.isAssigning
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
     * @returns {?PHPTypeUnion} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        let types = PHPTypeUnion.empty
        this.children.forEach(node => {
            types.addTypesFrom(node.check(context))
        })
        return types
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
     * @returns {?PHPTypeUnion} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        let pbr_positions
        if(this.what instanceof Identifier) {
            switch(this.what.name) {
                case "pcntl_waitpid":
                    pbr_positions = {1: true}
                    break
                case "preg_match":
                    pbr_positions = {2: true}
                    break
                default:
                    pbr_positions = {}
            }
        } else {
            pbr_positions = {}
        }
        this.arguments.forEach((arg, i) => {
            if(pbr_positions[i]) {
                let inner_context = context.childContext(true)
                inner_context.isAssigning = true
                arg.check(inner_context)
            } else {
                arg.check(context)
            }
        })
        let callable_types = this.what.check(context)
        let types = PHPTypeUnion.empty
        callable_types.types.forEach(t => types.addType(t))
        return types
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
     * @returns {?PHPTypeUnion} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        var inner_context = context.childContext()
        let arg_types = []
        this.arguments.forEach(
            node => arg_types.push(inner_context.addName(
                node.name,
                (node.type ? [node.type.name] : []).concat(
                    node.nullable ? [new PHPSimpleType("null")] : []
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
        let types = new PHPTypeUnion(new PHPFunctionType(arg_types, return_type))
        return types
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
     * @returns {?PHPTypeUnion} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        if(context.isAssigning) {
            return context.addName(
                '$' + this.name,
                context.isAssigning
            )
        } else {
            return this.assertHasName(context, '$' + this.name)
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
     * @returns {?PHPTypeUnion} The set of types applicable to this value
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
        return PHPTypeUnion.empty
    }
}
class Echo extends Sys {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?PHPTypeUnion} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        this.arguments.forEach(child => {
            let types = child.check(context)
        })
        return PHPTypeUnion.empty
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
     * @returns {?PHPTypeUnion} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        var inner_context = context.childContext()

        let arg_types = []
        this.arguments.forEach(
            node => arg_types.push(inner_context.addName(
                node.name,
                (node.type ? [node.type.name] : []).concat(
                    node.nullable ? [new PHPSimpleType("null")] : []
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
        let types = new PHPTypeUnion(new PHPFunctionType(arg_types, return_type))
        return types
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
     * @returns {?PHPTypeUnion} The set of types applicable to this value
     */
    check(context) {
        context.classContext.addIdentifier(
            this.name,
            this.visibility,
            this.isStatic,
            super.check(context)
        )
        return PHPTypeUnion.empty
    }
}
class _Number extends Literal {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?PHPTypeUnion} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        let types = new PHPTypeUnion(new PHPSimpleType("number"))
        return types
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
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?PHPTypeUnion} The set of types applicable to this value
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
     * @returns {?PHPTypeUnion} The set of types applicable to this value
     */
    check(context) {
        return super.check(context)
    }
}
class StaticLookup extends Lookup {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?PHPTypeUnion} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        if(
            this.what instanceof Identifier &&
            this.offset instanceof ConstRef
        ) {
            let resolved_name = this.what.resolvedName(context)
            let class_context = context.globalContext.findClass(resolved_name)
            if(class_context) {
                let types = class_context.findStaticIdentifier(this.offset.name, context.classContext)
                if(!types) {
                    throw new PHPStrictError(
                        `No accessible method ${resolved_name}::${this.offset.name}`,
                        context,
                        this.loc
                    )
                }
                console.log(types[0])
                return types
            } else {
                console.log(`Unable to find class named ${resolved_name}`)
            }
        } else {
            console.log(this.node)
            console.log("TODO don't know how to check this kind of lookup")
        }
        return PHPTypeUnion.empty
    }
}
class _String extends Literal {
    /** @type {string} */
    get label() {
        return this.node.label
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?PHPTypeUnion} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        let types = new PHPTypeUnion(new PHPSimpleType("string"))
        return types
    }
}
class Constant extends Declaration {
    /** @type {?Node} */
    get value() {
        return this.cacheNode("value")
    }
    // TODO add to global namespace?
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
     * @returns {?PHPTypeUnion} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        if(this.items) {
            this.items.forEach(
                item => item.check(context)
            )
        }
        return new PHPTypeUnion(new PHPSimpleType("array"))
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
     * @returns {?PHPTypeUnion} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        let left_types = this.left.check(context)
        let right_types = this.right.check(context)
        let types = PHPTypeUnion.empty
        switch(this.type) {
            case "|":
            case "&":
                types.addType(new PHPSimpleType("boolean"))
                break
            case "*":
            case "/":
            case "-":
                types.addType(new PHPSimpleType("number"))
                break
            case "+":
                if(left_types.types.length == 1 && "" + left_types[0] == "array") {
                    types.addTypesFrom(left_types)
                } else {
                    types.addType(new PHPSimpleType("number"))
                }
                break
            case ".":
                types.addType(new PHPSimpleType("string"))
                break
            case "~":
                types.addType(new PHPSimpleType("boolean"))
                break
            default:
                console.log(`Don't know how to parse operator type ${this.type}`)
                types.addTypesFrom(left_types)
                types.addTypesFrom(right_types)
        }
        return types
    }
}
class _Boolean extends Literal {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @returns {?PHPTypeUnion} The set of types applicable to this value
     */
    check(context) {
        super.check(context)
        return new PHPTypeUnion(new PHPSimpleType("boolean"))
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
}
class Eval extends Statement {
    /** @type {Node} */
    get source() {
        return this.cacheNode("source")
    }
}
class Exit extends Statement {
    /** @type {?Node} */
    get status() {
        return this.cacheNode("status")
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
}
class Global extends Statement {
    /** @type {Variable[]} */
    get items() {
        return this.cacheNodeArray("items")
    }
}
class Goto extends Statement {
    /** @type {string} */
    get label() {
        return this.node.label
    }
}
class Halt extends Statement {
    /** @type {string} */
    get after() {
        return this.node.after
    }
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
}
class Include extends Statement {
    /** @type {Node} */
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
}
class Inline extends Literal {
}
class Interface extends Declaration {
    /** @type {Identifier[]} */
    get extends() {
        return this.cacheNodeArray("extends")
    }
    /** @type {Declaration[]} */
    get body() {
        return this.cacheNodeArray("body")
    }
}
class Isset extends Sys {
}
class Label extends Node {
    /** @type {string} */
    get name() {
        return this.node.name
    }
}
class List extends Sys {
}
class Magic extends Literal {
}
class Namespace extends Block {
    /** @type {Identifier} */
    get name() {
        return this.cacheNode("name")
    }
    /** @type {Boolean} */
    get withBrackets() {
        return this.node.withBrackets
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
}
class Nowdoc extends Literal {
    /** @type {string} */
    get label() {
        return this.node.label
    }
}
class OffsetLookup extends Lookup {
}
class Parenthesis extends Operation {
    /** @type {Expression} */
    get inner() {
        return this.cacheNode("inner")
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
}
class Print extends Sys {
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
}
class Shell extends Literal {
}
class Silent extends Statement {
    /** @type {Expression} */
    get expr() {
        return this.cacheNode("expr")
    }
}
class Static extends Statement {
    /** @type {Variable[]|Assign[]} */
    get items() {
        return this.cacheNodeArray("items")
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
}
class Throw extends Statement {
    /** @type {Expression} */
    get what() {
        return this.cacheNode("what")
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
    /** @type {Block} */
    get always() {
        return this.cacheNode("always")
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
}
class Unset extends Sys {
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
    get item() {
        return this.cacheNodeArray("item")
    }
}
class UseItem extends Statement {
    /** @type {Identifier} */
    get name() {
        return this.cacheNode("name")
    }
    /** @type {?string} */
    get type() {
        return this.node.type
    }
    /** @type {?string} */
    get alias() {
        return this.node.alias
    }
}
class Variadic extends Expression {
    /** @type {Array|Expression} */
    get what() {
        return this.cacheNode("what")
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
