"use strict"

import Context from "./context"
import {FileContext} from "./file-context"
import {GlobalContext} from "./global-context"
import * as ShadowTree from "./shadowtree"
import PHPStrictError from "./php-strict-error"

var fs = require("fs")

const ShowContextLines = 10

const UseANSIHighlight = false

class Lint {
    /**
     * @type {LintSingle}
     */
    static get single() {
        if(!this._single) {
            this._single = new LintSingle()
        }
        return this._single
    }
    static set single(v) {
        this._single = v
    }

    /**
     * Builds the object
     * @param {Object} tree AST from php-parser
     * @param {?string} [filename]
     * @param {?GlobalContext} [global_context]
     */
    constructor(tree, filename = null, global_context = null) {
        this.filename = filename
        this.tree = tree
        /**
         * @type {GlobalContext}
         */
        this._globalContext = global_context
    }

    /**
     * @type {GlobalContext}
     */
    get globalContext() {
        if(!this._globalContext) {
            return Lint.single.globalContext
        }
        return this._globalContext
    }
    set globalContext(v) {
        this._globalContext = v
    }

    /**
     * Checks the current data
     * @param {number} [depth] The current load depth
     * @param {?string} [working_directory]
     * @throws
     * @returns {boolean}
     */
    check(depth = 0, working_directory = null) {
        if(this.filename) {
            this.globalContext.addFile(this.filename, depth, () => {
                if(working_directory) {
                    this.globalContext.workingDirectory = working_directory
                }
                return this.checkUncached(depth)
            })
            let fr = this.globalContext.results.find(fr => fr.filename == this.filename)
            if(fr.error) {
                throw fr.error
            } else {
                return fr.result
            }
        } else {
            return this.checkUncached(depth)
        }
    }

    /**
     * Checks the current data (without caching)
     *
     * @param {number} [depth] The current load depth
     * @throws
     * @returns {boolean}
     */
    checkUncached(depth = 0) {
        ShadowTree.Node.typed(this.tree).check(
            new Context(
                new FileContext(this.filename, depth),
                this.globalContext,
                null,
                null,
                depth
            ),
            new Set(),
            null
        )
        return true
    }
};

class LintSingle {
    /**
     * @type {GlobalContext}
     */
    get globalContext() {
        if(!this._globalContext) {
            this._globalContext = new GlobalContext()
        }
        return this._globalContext
    }
    set globalContext(v) {
        this._globalContext = v
    }
    /**
     * @type {{[x: string]: (boolean|{[y: string]: boolean})}} The error classes to ignore
     */
    get ignoreErrorMap() {
        return ShadowTree.Node.ignoreErrorMap
    }
    get PHPStrictError() {
        return PHPStrictError
    }
    get ShadowTree() {
        return ShadowTree
    }
    get silenceVendor() {
        return ShadowTree.Node.silenceVendor
    }
    set silenceVendor(v) {
        ShadowTree.Node.silenceVendor = v
    }

    /**
     * Checks the provided AST
     * @param {Object} tree AST from php-parser
     * @param {?string} [filename]
     * @param {boolean} [throw_on_error]
     * @param {number} [depth]
     * @param {?string} [working_directory]
     * @param {boolean} [reuse_global_context]
     * @throws
     * @returns {boolean}
     */
    checkTree(
        tree,
        filename = null,
        throw_on_error = true,
        depth = 0,
        working_directory = null,
        reuse_global_context = true
    ) {
        let l = new Lint(
            tree,
            filename,
            reuse_global_context ? null : new GlobalContext()
        )
        try {
            return l.check(depth, working_directory)
        } catch(e) {
            if(e instanceof PHPStrictError && !throw_on_error) {
                console.log(e.message)
                if(e.filename) {
                    let lines = fs.readFileSync(e.filename, "utf8").split(/\n/)
                    if(e.loc.start.line >= ShowContextLines) {
                        console.log(lines.slice(e.loc.start.line - ShowContextLines, e.loc.start.line - 1).join("\n"))
                    } else {
                        console.log(lines.slice(0, e.loc.start.line - 1).join("\n"))
                    }
                    if(e.loc.start.line == e.loc.end.line) {
                        console.log(
                            this.highlight(
                                lines[e.loc.start.line - 1],
                                e.loc.start.column,
                                e.loc.end.column
                            )
                        )
                    } else {
                        let middle = lines.slice(
                            e.loc.start.line,
                            e.loc.end.line - 1
                        )
                        let middle_highlight
                        if(middle.length > 10) {
                            middle_highlight = middle.slice(0, 5).map(
                                l => this.highlight(l)
                            ).join("\n") + "\n...\n" + middle.slice(-5).map(
                                l => this.highlight(l)
                            ).join("\n")
                        } else {
                            middle_highlight = middle.map(
                                l => this.highlight(l)
                            ).join("\n")
                        }
                        console.log(
                            this.highlight(
                                lines[e.loc.start.line - 1],
                                e.loc.start.column
                            ) +
                            "\n" +
                            middle_highlight +
                            "\n" +
                            this.highlight(
                                lines[e.loc.end.line - 1],
                                null,
                                e.loc.end.column
                            )
                        )
                    }
                }
                return null
            } else {
                throw e
            }
        }
    }
    /**
     * Returns the string with the given range highlighted. null-null is the
     * whole string.
     *
     * @param {string} line
     * @param {?number} [start]
     * @param {?number} [end]
     * @returns {string}
     */
    highlight(line, start = null, end = null) {
        if(UseANSIHighlight && process.stdout.isTTY) {
            if(start === null && end === null) {
                return `\x1b[4m${line}\x1b[24m`
            } else if(start === null) {
                return `\x1b[4m${line.substr(0, end)}\x1b[24m` +
                    line.substr(end)
            } else {
                if(end === null) {
                    return line.substr(0, start) +
                        `\x1b[4m${line.substr(start)}\x1b[24m`
                } else {
                    return line.substr(0, start) +
                        `\x1b[4m${line.substr(start, end + 1)}\x1b[24m` +
                        line.substr(end + 1)
                }
            }
        } else {
            if(start === null && end === null) {
                return line + "\n" + line.replace(/\S/g, "~")
            } else if(start === null) {
                return line +
                    "\n" +
                    line.substr(0, end).replace(/\S/g, "~")
            } else {
                let prefix_space = line.substr(0, start).replace(/\S/g, " ")
                if(end === null) {
                    return line +
                        "\n" +
                        prefix_space +
                        "^" +
                        line.substr(start + 1).replace(/\S/g, "~")
                } else {
                    return line +
                        "\n" +
                        prefix_space +
                        "^" +
                        "~".repeat(end - start - 1)
                }
            }
        }
    }
}

export default Lint
