"use strict"

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
