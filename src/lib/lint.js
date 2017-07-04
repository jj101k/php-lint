"use strict"

import Context, {FileContext} from "./context"
import ShadowTree from "./shadowtree"
import PHPStrictError from "./phpstricterror"

class Lint {
    static get PHPStrictError() {
        return PHPStrictError
    }
    static get ShadowTree() {
        return ShadowTree
    }
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
        return ShadowTree.Node.typed(this.tree).check(
            new Context(
                new FileContext(this.filename)
            )
        )
    }
    static check(tree, filename = null) {
        var l = new Lint(tree, filename);
        return l.check();
    }
};

module.exports = Lint;
