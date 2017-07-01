"use strict"

/**
 * This defines the entire context applying to the current node.
 */
class Context {
    /**
     * Builds the object
     */
    constructor() {
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
     * If the name is in the namespace, returns its possible types
     * @param {string} name eg "$bar"
     * @returns {boolean}
     */
    findName(name) {
        var types = this.ns[name]
        return types
    }
}

class Lint {
    constructor(tree, filename = null, namespace = []) {
        Object.assign(
            this,
            {
                filename: filename,
                namespace: namespace,
                tree: tree,
            }
        );
    }
    check() {
        return Node.typed(this.tree).check(new Context());
    }
    static check(tree, filename = null) {
        var l = new Lint(tree, filename);
        return l.check();
    }
};

Lint.PHPStrictError = class extends Error {
};
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
    /** @type {?Location} */
    get loc() {
        return this.node.loc;
    }
    assertHasName(context, name) {
        var types = context.findName(name)
        if(!types) {
            throw new Lint.PHPStrictError(
                `Name ${name} is not defined in this namespace, contents are: ${Object.keys(context.ns)}`
            );
        }
        return types
    }
    /**
     * Returns a shadow tree node wrapping the given node (caches)
     * @param {string} name
     * @returns {Node}
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
     * @returns {?string[]} The set of types applicable to this value
     */
    check(context) {
        return []
    }
    /**
     * Returns the shadow tree counterpart of the given node.
     * @param {Node} node
     * @returns {Node}
     */
    static typed(node) {
        var c = Lint.ShadowTree[node.constructor.name];
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
    /** @type {string} One of UNQUALIFIED_NAME,
         *     QUALIFIED_NAME, FULL_QUALIFIED_NAME or RELATIVE_NAME */
    get resolution() {
        return this.node.resolution;
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
    check(context) {
        super.check(context)
        this.children.forEach(node => node.check(context))
        return []
    }
}
class Call extends Statement {
    /**
     * @type {object[]}
     */
    get arguments() {
        return this.node.arguments
    }
    /**
     * @type {?object}
     */
    get what() {
        return this.node.what
    }
}
class Closure extends Statement {
    /** @type {Parameter[]} */
    get arguments() {
        return this.cacheNodeArray("arguments");
    }
    /** @type {?Block} */
    get body() {
        return this.cacheNode("body");
    }
    /** @type {bool} */
    get byref() {
        return this.node.byref;
    }
    /** @type {bool} */
    get nullable() {
        return this.node.nullable;
    }
    /** @type {object[]} */
    get type() {
        return this.node.type;
    }
    check(context) {
        super.check(context)
        var inner_context = new Context()
        this.arguments.forEach(
            node => inner_context.addName(
                '$' + node.name,
                (node.type ? [node.type.name] : []).concat(
                    node.nullable ? ["null"] : []
                )
            )
        )
        this.type.forEach(
            t => inner_context.addName(
                t[1],
                this.assertHasName(context, t[1])
            )
        )
        if(this.body) this.body.check(inner_context)
        return ["closure"]
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
        return this.node.value
    }
}
class Sys extends Statement {
    /** @type {Node[]} */
    get arguments() {
        return this.cacheNodeArray("arguments");
    }
}
class Variable extends Expression {
    /** @type {bool} */
    get byref() {
        return this.node.byref;
    }
    /** @type {string|Node} */
    get name() {
        return this.cacheProperty(
            "name",
            node => {
                if(typeof node == "object") {
                    return Node.typed(child);
                } else {
                    return node;
                }
            }
        );
    }
    check(context) {
        super.check(context)
        return this.assertHasName(context, '$' + this.name)
    }
}
class Class extends Declaration {
    /**
     * @type {object[]}
     */
    get body() {
        return this.node.body
    }
    /**
     * @type {?object}
     */
    get extends() {
        return this.node.extends
    }
    /**
     * @type {object[]}
     */
    get implements() {
        return this.node.implements
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
}
class Echo extends Sys {
    check(context) {
        super.check(context)
        this.arguments.forEach(child => child.check(context))
        return []
    }
}
class _Function extends Declaration {
    /** @type {Parameter[]} */
    get arguments() {
        return this.cacheNodeArray("arguments");
    }
    /** @type {?Block} */
    get body() {
        return this.cacheNode("body");
    }
    /** @type {bool} */
    get byref() {
        return this.node.byref;
    }
    /** @type {bool} */
    get nullable() {
        return this.node.nullable;
    }
    /** @type {object[]} */
    get type() {
        return this.node.type;
    }
    check(context) {
        super.check(context)
        var inner_context = new Context()

        this.arguments.forEach(
            node => inner_context.addName(
                node.name,
                (node.type ? [node.type.name] : []).concat(
                    node.nullable ? ["null"] : []
                )
            )
        )
        if(this.type) {
            this.type.forEach(
                t => inner_context.addName(
                    t[1],
                    this.assertHasName(context, t[1])
                )
            )
        }

        if(this.body) this.body.check(inner_context)
        return ["function"]
    }
}
class Number extends Literal {
    check(context) {
        super.check(context)
        return ["number"]
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
    /** @type {object[]} */
    get type() {
        return this.node.type
    }
    /** @type {*} */
    get value() {
        return this.node.value
    }
    /** @type {boolean} */
    get variadic() {
        return this.node.variadic
    }
}
class Program extends Block {
    /** @type {Error[]} */
    get errors() {
        return this.node.errors
    }
    check(context) {
        var inner_context = new Context();
        this.children.forEach(child => child.check(inner_context));
        return super.check(context);
    }
}
class String extends Literal {
    /** @type {string} */
    get label() {
        return this.node.label
    }
    check(context) {
        super.check(context)
        return ["string"]
    }
}
Lint.ShadowTree = {
    Assign: Assign,
    Block: Block,
    Call: Call,
    Class: Class,
    Closure: Closure,
    Declaration: Declaration,
    Echo: Echo,
    Expression: Expression,
    _Function: _Function,
    Identifier: Identifier,
    Literal: Literal,
    Node: Node,
    Number: Number,
    Parameter: Parameter,
    Program: Program,
    Statement: Statement,
    String: String,
    Sys: Sys,
    TraitUse: TraitUse,
    Variable: Variable,
}
module.exports = Lint;
