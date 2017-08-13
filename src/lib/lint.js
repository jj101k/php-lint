"use strict"

import Context from "./context"
import {FileContext} from "./file-context"
import {GlobalContext} from "./global-context"
import * as ShadowTree from "./shadowtree"
import PHPStrictError from "./php-strict-error"

var fs = require("fs")

const ShowContextLines = 10

class Lint {
    static get globalContext() {
        if(!this._globalContext) {
            this._globalContext = new GlobalContext()
        }
        return this._globalContext
    }
    /**
     * @type {{[x: string]: (boolean|{[y: string]: boolean})}} The error classes to ignore
     */
    static get ignoreErrorMap() {
        return ShadowTree.Node.ignoreErrorMap
    }
    static get PHPStrictError() {
        return PHPStrictError
    }
    static get ShadowTree() {
        return ShadowTree
    }

    /**
     * Builds the object
     * @param {Object} tree AST from php-parser
     * @param {?string} [filename]
     */
    constructor(tree, filename = null) {
        this.filename = filename
        this.tree = tree
    }

    /**
     * Checks the current data
     * @param {number} [depth] The current load depth
     * @throws
     * @returns {boolean}
     */
    check(depth = 0) {
        if(this.filename) {
            if(!Lint.globalContext.depths.hasOwnProperty(this.filename)) {
                Lint.globalContext.depths[this.filename] = depth
                Lint.globalContext.results[this.filename] = false
                try {
                    Lint.globalContext.results[this.filename] = this.checkUncached(depth)
                } catch(e) {
                    Lint.globalContext.results[this.filename] = e
                }
            }
            if(Lint.globalContext.results[this.filename] instanceof Error) {
                throw Lint.globalContext.results[this.filename]
            } else {
                return Lint.globalContext.results[this.filename]
            }
        } else {
            return this.checkUncached(depth)
        }
    }

    /**
     * Checks the current data (without caching)
     * @param {number} [depth] The current load depth
     * @throws
     * @returns {boolean}
     */
    checkUncached(depth = 0) {
        ShadowTree.Node.typed(this.tree).check(
            new Context(
                new FileContext(this.filename, depth),
                Lint.globalContext,
                null,
                null,
                depth
            ),
            false,
            null
        )
        return true
    }

    /**
     * Checks the provided AST
     * @param {Object} tree AST from php-parser
     * @param {?string} [filename]
     * @param {boolean} [throw_on_error]
     * @param {number} [depth]
     * @throws
     * @returns {boolean}
     */
    static check(tree, filename = null, throw_on_error = true, depth = 0) {
        var l = new Lint(tree, filename)
        try {
            return l.check(depth)
        } catch(e) {
            if(e instanceof PHPStrictError && !throw_on_error) {
                console.log(e.message)
                if(filename) {
                    var lines = fs.readFileSync(filename, "utf8").split(/\n/)
                    if(e.loc.start.line >= ShowContextLines) {
                        console.log(lines.slice(e.loc.start.line - ShowContextLines, e.loc.start.line).join("\n"))
                    } else {
                        console.log(lines.slice(0, e.loc.start.line).join("\n"))
                    }
                    let prefix_space = lines[e.loc.start.line - 1].substr(0, e.loc.start.column).replace(/\S/g, " ")
                    if(e.loc.start.line == e.loc.end.line) {
                        console.log(
                            prefix_space + "^" +
                            "~".repeat(e.loc.end.column - e.loc.start.column - 1)
                        )
                    } else {
                        console.log(
                            prefix_space + "^" +
                            lines[e.loc.start.line - 1].substr(e.loc.start.column + 1).replace(/\S/g, "~") +
                            "\n" +
                            lines.slice(
                                e.loc.start.line,
                                e.loc.end.line
                            ).map((l, i) => {
                                if(i == e.loc.end.line - e.loc.start.line - 1) {
                                    return l + "\n" + l.substr(0, e.loc.end.column).replace(/\S/g, "~")
                                } else {
                                    return l + "\n" + l.replace(/\S/g, "~")
                                }
                            }).join("\n")
                        )
                    }
                }
                return null
            } else {
                throw e
            }
        }
    }
};

export default Lint
