"use strict"

import Context from "./context"
import ShadowTree from "./shadowtree"

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

import PHPStrictError from "./phpstricterror"
Lint.PHPStrictError = PHPStrictError
Lint.ShadowTree = ShadowTree
module.exports = Lint;
