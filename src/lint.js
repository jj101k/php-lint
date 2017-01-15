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
        /** @property {Location|null} loc
          * @property {string} kind
          */
        constructor(node) {
            Object.assign(
                this,
                node
            );
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
            /** @property {Expression} left
              * @property {Expression} right
              * @property {string} operator
              */
            constructor(node) {
                super(node);
                this.left = Lint.ShadowTree.Node.typed(node.left);
                this.right = Lint.ShadowTree.Node.typed(node.right);
            }
            check(ns) {
                ns.push(this.left.name);
                this.right.check(ns);
                return super.check(ns);
            }
        },
        Block: class extends Lint.ShadowTree.Statement {
            /** @property {Node[]} children */
            constructor(node) {
                super(node);
                this.children = node.children.map(child => Lint.ShadowTree.Node.typed(child));
            }
        },
        Literal: class extends Lint.ShadowTree.Expression {
            /** @property {Node|string|number|boolean|null} value */
        },
        Sys: class extends Lint.ShadowTree.Statement {
            /** @property {Node[]} arguments */
            constructor(node) {
                super(node);
                this.arguments = node.arguments.map(child => Lint.ShadowTree.Node.typed(child));
            }
        },
        Variable: class extends Lint.ShadowTree.Expression {
            /** @property {string|Node} name
              * @property {bool} byref
              */
            constructor(node) {
                super(node);
                if(typeof this.name == "object") {
                    this.name = Lint.ShadowTree.Node.typed(child);
                }
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
