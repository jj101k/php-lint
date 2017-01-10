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
    get nodeHandlers() {
        return {
            assign: node => {
                this.namespace.push(node.left.name);
                this.checkTypedNode(node.right);
            },
            echo: node => {
                node.arguments.forEach(n => this.checkTypedNode(n));
            },
            number: () => {},
            program: node => {
                node.children.forEach(n => this.checkTypedNode(n));
            },
            variable: node => {
                if(!this.namespace.find(name => name == node.name)) {
                    throw new Lint.PHPStrictError(`Name ${node.name} is not defined in this namespace`);
                }
            },
            string: () => {},
        };
    }
    check() {
        this.checkTypedNode(this.tree);
        return true;
    }
    checkTypedNode(node) {
        if(this.nodeHandlers[node.kind]) {
            return this.nodeHandlers[node.kind](node);
        } else {
            throw new Error(`Don't know how to handle nodes of type ${node.kind}`);
        }
    }
    static check(tree, filename = null) {
        var l = new Lint(tree, filename);
        return l.check();
    }
};

Lint.PHPStrictError = class extends Error {
};
module.exports = Lint;
