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
        return Lint.ShadowTree.Node.typed(this.tree).check();
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
        cacheProperty(name, f) {
            if(!this._cache.hasOwnProperty(name)) {
                this._cache[name] = f(this.node[name]);
            }
            return this._cache[name];
        }
        check(ns) {
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
        Statement: class extends Lint.ShadowTree.Node {
        },
        Expression: class extends Lint.ShadowTree.Node {
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
                return this.cacheProperty("left", subnode => Lint.ShadowTree.Node.typed(subnode))
            }
            /** @property {Expression} right */
            get right() {
                return this.cacheProperty("right", subnode => Lint.ShadowTree.Node.typed(subnode))
            }
            check(ns) {
                ns.push(this.left.name);
                this.right.check(ns);
                return super.check(ns);
            }
        },
        Block: class extends Lint.ShadowTree.Statement {
            /** @property {Node[]} children */
            get children() {
                return this.cacheProperty(
                    "children",
                    nodes => nodes.map(child => Lint.ShadowTree.Node.typed(child))
                );
            }
        },
        Literal: class extends Lint.ShadowTree.Expression {
            /** @property {Node|string|number|boolean|null} value */
        },
        Sys: class extends Lint.ShadowTree.Statement {
            /** @property {Node[]} arguments */
            get arguments() {
                return this.cacheProperty(
                    "arguments",
                    nodes => nodes.map(child => Lint.ShadowTree.Node.typed(child))
                );
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
            check(ns) {
                if(!ns.find(name => name == this.name)) {
                    throw new Lint.PHPStrictError(`Name \$${this.name} is not defined in this namespace`);
                }
                return super.check(ns);
            }
        },
    }
);
Object.assign(
    Lint.ShadowTree,
    {
        Echo: class extends Lint.ShadowTree.Sys {
            check(ns) {
                this.arguments.forEach(child => child.check(ns));
                return super.check(ns);
            }
        },
        Program: class extends Lint.ShadowTree.Block {
            /** @property {Error[]} errors */
            check(ns) {
                var ns_inner = [];
                this.children.forEach(child => child.check(ns_inner));
                return super.check(ns);
            }
        },
        String: class extends Lint.ShadowTree.Literal {
            /** @property {string} label */
        },
    }
);
module.exports = Lint;
