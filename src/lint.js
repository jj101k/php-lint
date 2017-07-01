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
        return Lint.ShadowTree.Node.typed(this.tree).check(new Context());
    }
    static check(tree, filename = null) {
        var l = new Lint(tree, filename);
        return l.check();
    }
};

Lint.PHPStrictError = class extends Error {
};
Lint.ShadowTree = {
    Node: class {
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
        cacheNode(name) {
            return this.cacheProperty(
                name,
                subnode => subnode ?
                    Lint.ShadowTree.Node.typed(subnode) :
                    subnode
            );
        }
        cacheNodeArray(name) {
            return this.cacheProperty(
                name,
                subnodes => subnodes ? subnodes.map(
                    subnode => Lint.ShadowTree.Node.typed(subnode)
                ) : subnodes
            );
        }
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
        static typed(node) {
            var c = Lint.ShadowTree[node.constructor.name];
            if(!c) {
                throw new Error(`No handler for ${node.constructor.name}`);
            }
            return new c(node);
        }
    },
};
Object.assign(
    Lint.ShadowTree,
    {
        Expression: class extends Lint.ShadowTree.Node {
        },
        Identifier: class extends Lint.ShadowTree.Node {
            /** @type {string} */
            get name() {
                return this.node.name;
            }
            /** @type {string} One of UNQUALIFIED_NAME,
              *     QUALIFIED_NAME, FULL_QUALIFIED_NAME or RELATIVE_NAME */
            get resolution() {
                return this.node.resolution;
            }
        },
        Statement: class extends Lint.ShadowTree.Node {
        },
        TraitUse: class extends Lint.ShadowTree.Node {
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
        },
    }
);
Object.assign(
    Lint.ShadowTree,
    {
        Assign: class extends Lint.ShadowTree.Statement {
            /** @type {string} */
            get operator() {
                return this.node.operator;
            }
            /** @type {Expression} */
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
        },
        Block: class extends Lint.ShadowTree.Statement {
            /** @type {Node[]} */
            get children() {
                return this.cacheNodeArray("children");
            }
            check(context) {
                super.check(context)
                this.children.forEach(node => node.check(context))
                return []
            }
        },
        Closure: class extends Lint.ShadowTree.Statement {
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
        },
        Declaration: class extends Lint.ShadowTree.Statement {
            /** @type {string} */
            get name() {
                return this.node.name
            }
        },
        Literal: class extends Lint.ShadowTree.Expression {
            /** @type {Node|string|number|boolean|null} */
            get value() {
                return this.node.value
            }
        },
        Sys: class extends Lint.ShadowTree.Statement {
            /** @type {Node[]} */
            get arguments() {
                return this.cacheNodeArray("arguments");
            }
        },
        Variable: class extends Lint.ShadowTree.Expression {
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
                            return Lint.ShadowTree.Node.typed(child);
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
        },
    }
);
Object.assign(
    Lint.ShadowTree,
    {
        Echo: class extends Lint.ShadowTree.Sys {
            check(context) {
                super.check(context)
                this.arguments.forEach(child => child.check(context))
                return []
            }
        },
        _Function: class extends Lint.ShadowTree.Declaration {
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
        },
        Number: class extends Lint.ShadowTree.Literal {
            check(context) {
                super.check(context)
                return ["number"]
            }
        },
        Parameter: class extends Lint.ShadowTree.Declaration {
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
        },
        Program: class extends Lint.ShadowTree.Block {
            /** @type {Error[]} */
            get errors() {
                return this.node.errors
            }
            check(context) {
                var inner_context = new Context();
                this.children.forEach(child => child.check(inner_context));
                return super.check(context);
            }
        },
        String: class extends Lint.ShadowTree.Literal {
            /** @type {string} */
            get label() {
                return this.node.label
            }
            check(context) {
                super.check(context)
                return ["string"]
            }
        },
    }
);
module.exports = Lint;
