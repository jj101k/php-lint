"use strict"

const Context = require("./context")
const ShadowTree = require("./shadowtree")

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
        return ShadowTree.Node.typed(this.tree).check(new Context());
    }
    static check(tree, filename = null) {
        var l = new Lint(tree, filename);
        return l.check();
    }
};

Lint.PHPStrictError = require("./phpstricterror");
Lint.ShadowTree = ShadowTree
module.exports = Lint;
