import * as phpParser from "php-parser"
import * as fs from "fs"
import * as path from "path"

import Lint from "./lint"
import { LintError } from "./lint-error";
/**
 * The top-level lint support
 */
export default class PHPLint {
    #_lint = null
    #_parser = null

    get lint() {
        if(!this.#_lint) {
            this.#_lint = new Lint(this)
        }
        return this.#_lint
    }
    get parser() {
        if(!this.#_parser) {
            this.#_parser = new phpParser.default({
                parser: {
                    debug: false,
                    extractDoc: true,
                },
                ast: {
                    withPositions: true,
                },
            })
        }
        return this.#_parser
    }

    /**
     * Gives you back a full filename and, where needed, and inferred working
     * directory.
     *
     * @param working_directory
     * @param filename
     */
    expandFilename(
        working_directory,
        filename
    ) {
        if(working_directory !== null) {
            return {
                workingDirectory: working_directory,
                expandedFilename: path.resolve(working_directory, filename),
            }
        } else {
            let d = filename
            let o
            do {
                o = d
                d = path.dirname(d)
                const composer_filename = path.resolve(d, "composer.json")
                if(fs.existsSync(composer_filename)) {
                    return {
                        workingDirectory: d,
                        expandedFilename: filename,
                    }
                }
            } while(d && (o != d))

            return {
                workingDirectory: path.dirname(filename),
                expandedFilename: filename,
            }
        }
    }

    /**
     * Checks the file
     *
     * @param depth How far recursion has gone. Very deep code may be skipped.
     */
    async checkFile(
        filename,
        depth = 0,
        working_directory = null
    ) {
        const expanded = this.expandFilename(working_directory, filename)
        try {
            const data = await new Promise(
                (resolve, reject) => fs.readFile(expanded.expandedFilename, "utf8", (err, data) => {
                    if(err) {
                        reject(err)
                    } else {
                        resolve(data)
                    }
                })
            )
            const tree = this.parser.parseCode(data)
            this.lint.workingDirectory = expanded.workingDirectory
            return this.lint.checkTree(tree, false, filename)
        } catch(e) {
            if(e instanceof LintError) {
                console.log(new Error(`${expanded.expandedFilename}: ${e.message}`))
            } else {
                console.log(e)
            }
            return null
        }
    }
    /**
     * Checks the file and maybe throws (or warns)
     *
     * @param depth How far recursion has gone. Very deep code may be skipped.
     * @throws
     */
    checkFileSync(
        filename,
        throw_on_error = true,
        depth = 0,
        working_directory = null,
        reuse_context = false
    ) {
        const expanded = this.expandFilename(working_directory, filename)
        const data = fs.readFileSync(expanded.expandedFilename, "utf8")
        try {
            const tree = this.parser.parseCode(data)
            this.lint.workingDirectory = expanded.workingDirectory
            return this.lint.checkTree(tree, reuse_context, filename, depth)
        } catch(e) {
            if(e instanceof LintError) {
                throw new Error(`${expanded.expandedFilename}: ${e.message}`)
            } else {
                throw e
            }
        }
    }
    /**
     * Checks the code
     *
     * @param depth How far recursion has gone. Very deep code may be skipped.
     */
    checkSourceCode(
        code,
        depth = 0
    ) {
        return new Promise((resolve, reject) => {
            try {
                const tree = this.parser.parseCode(code)
                resolve(this.lint.checkTree(tree))
            } catch(e) {
                reject(e)
            }
        })
    }
    /**
     * Checks the code and maybe throws (or warns)
     *
     * @param depth How far recursion has gone. Very deep code may be skipped.
     * @throws
     */
    checkSourceCodeSync(
        code,
        throw_on_error = true,
        depth = 0
    ) {
        const tree = this.parser.parseCode(code)
        return this.lint.checkTree(tree)
    }
}