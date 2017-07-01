"use strict"

/**
 * This defines the entire context applying to the current node.
 */
class Context {
    /**
     * Builds the object
     */
    constructor() {
        this.ns = []
    }
    /**
     * Adds a name to the namespace list.
     * @param {string} name eg. "$foo"
     */
    addName(name) {
        this.ns.push(name)
    }
    /**
     * If the name is in the namespace, returns it.
     * @param {string} name eg "$bar"
     * @returns {?string}
     */
    findName(name) {
        return this.ns.find(n => n == name)
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
        /** @property {string} kind */
        get kind() {
            return this.node.kind;
        }
        /** @property {Location|null} loc */
        get loc() {
            return this.node.loc;
        }
        assertHasName(context, name) {
            if(!context.findName(name)) {
                throw new Lint.PHPStrictError(`Name ${name} is not defined in this namespace`);
            }
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
        check(context) {
            return true;
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
            /** @property {string} name */
            get name() {
                return this.node.name;
            }
            /** @property {string} resolution One of UNQUALIFIED_NAME,
              *     QUALIFIED_NAME, FULL_QUALIFIED_NAME or RELATIVE_NAME */
            get resolution() {
                return this.node.resolution;
            }
        },
        Statement: class extends Lint.ShadowTree.Node {
        },
        TraitUse: class extends Lint.ShadowTree.Node {
            /** @property {Identifier[]} adaptations */
            get adaptations() {
                return this.cacheNodeArray("adaptations");
            }
            /** @property {Node[]|null} traits */
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
            /** @property {string} operator */
            get operator() {
                return this.node.operator;
            }
            /** @property {Expression} left */
            get left() {
                return this.cacheNode("left")
            }
            /** @property {Expression} right */
            get right() {
                return this.cacheNode("right")
            }
            check(context) {
                context.addName('$' + this.left.name);
                this.right.check(context);
                return super.check(context);
            }
        },
        Block: class extends Lint.ShadowTree.Statement {
            /** @property {Node[]} children */
            get children() {
                return this.cacheNodeArray("children");
            }
            check(context) {
                this.children.forEach(node => node.check(context));
                return super.check(context);
            }
        },
        Closure: class extends Lint.ShadowTree.Statement {
            /** @property {Parameter[]} arguments */
            get arguments() {
                return this.cacheNodeArray("arguments");
            }
            /** @property {Block|null} body */
            get body() {
                return this.cacheNode("body");
            }
            /** @property {bool} byref */
            get byref() {
                return this.node.byref;
            }
            /** @property {bool} nullable */
            get nullable() {
                return this.node.nullable;
            }
            /** @property {object[]} type */
            get type() {
                return this.node.type;
            }
            check(context) {
                this.type.forEach(t => this.assertHasName(context, t[1]));
                var inner_context = new Context();
                this.arguments.forEach(node => inner_context.addName('$' + node.name));
                this.type.forEach(t => inner_context.addName(t[1]));
                if(this.body) this.body.check(inner_context);
                return super.check(context);
            }
        },
        Literal: class extends Lint.ShadowTree.Expression {
            /** @property {Node|string|number|boolean|null} value */
        },
        Sys: class extends Lint.ShadowTree.Statement {
            /** @property {Node[]} arguments */
            get arguments() {
                return this.cacheNodeArray("arguments");
            }
        },
        Variable: class extends Lint.ShadowTree.Expression {
            /** @property {bool} byref */
            get byref() {
                return this.node.byref;
            }
            /** @property {string|Node} name */
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
                this.assertHasName(context, '$' + this.name);
                return super.check(context);
            }
        },
    }
);
Object.assign(
    Lint.ShadowTree,
    {
        Echo: class extends Lint.ShadowTree.Sys {
            check(context) {
                this.arguments.forEach(child => child.check(context));
                return super.check(context);
            }
        },
        Number: class extends Lint.ShadowTree.Literal {
        },
        Program: class extends Lint.ShadowTree.Block {
            /** @property {Error[]} errors */
            check(context) {
                var inner_context = new Context();
                this.children.forEach(child => child.check(inner_context));
                return super.check(context);
            }
        },
        String: class extends Lint.ShadowTree.Literal {
            /** @property {string} label */
        },
    }
);
module.exports = Lint;
