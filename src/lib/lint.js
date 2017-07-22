"use strict"

import Context from "./context"
import {FileContext} from "./file-context"
import {GlobalContext} from "./global-context"
import ShadowTree from "./shadowtree"
import PHPStrictError from "./phpstricterror"

var fs = require("fs")

const ShowContextLines = 10

class Lint {
    static get globalContext() {
        if(!this._globalContext) {
            this._globalContext = new GlobalContext()
        }
        return this._globalContext
    }
    static get PHPStrictError() {
        return PHPStrictError
    }
    static get ShadowTree() {
        return ShadowTree
    }
    constructor(tree, filename = null, namespace = []) {
        this.filename = filename
        this.namespace = namespace
        this.tree = tree
    }
    check() {
        return ShadowTree.Node.typed(this.tree).check(
            new Context(
                new FileContext(this.filename),
                Lint.globalContext
            )
        )
    }
    static check(tree, filename = null, throw_on_error = true) {
        var l = new Lint(tree, filename)
        try {
            return l.check()
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
