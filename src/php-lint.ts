import * as phpParser from "php-parser"
import * as fs from "fs"
import * as path from "path"

import Lint from "./lint"
/**
 * The top-level lint support
 */
export default class PHPLint {
    private _lint: Lint | null = null
    private _parser: phpParser.default | null = null

    protected get lint(): Lint {
        if(!this._lint) {
            this._lint = new Lint(this)
        }
        return this._lint
    }
    protected get parser(): phpParser.default {
        if(!this._parser) {
            this._parser = new phpParser.default({
                parser: {
                    debug: false,
                    extractDoc: true,
                },
                ast: {
                    withPositions: true,
                },
            })
        }
        return this._parser
    }

    /**
     * Gives you back a full filename and, where needed, and inferred working
     * directory.
     *
     * @param working_directory
     * @param filename
     */
    protected expandFilename(
        working_directory: string | null,
        filename: string
    ): {workingDirectory: string, expandedFilename: string} {
        if(working_directory !== null) {
            return {
                workingDirectory: working_directory,
                expandedFilename: path.resolve(working_directory, filename),
            }
        } else {
            let d = filename
            do {
                d = path.dirname(d)
                const composer_filename = path.resolve(d, "composer.json")
                if(fs.existsSync(composer_filename)) {
                    return {
                        workingDirectory: d,
                        expandedFilename: filename,
                    }
                }
            } while(d)

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
        filename: string,
        depth: number = 0,
        working_directory: string|null = null
    ): Promise<boolean | null> {
        const expanded = this.expandFilename(working_directory, filename)
        try {
            const data = await new Promise<string>(
                (resolve, reject) => fs.readFile(expanded.expandedFilename, "utf8", (err, data) => {
                    if(err) {
                        reject(err)
                    } else {
                        resolve(data)
                    }
                })
            )
            const tree: any = this.parser.parseCode(data)
            this.lint.workingDirectory = expanded.workingDirectory
            return this.lint.checkTree(tree)
        } catch(e) {
            if(e.message.match(/^Line/)) { // FIXME
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
        filename: string,
        throw_on_error: boolean = true,
        depth: number = 0,
        working_directory: string|null = null,
        reuse_context: boolean = false
    ): boolean|null {
        const expanded = this.expandFilename(working_directory, filename)
        const data = fs.readFileSync(expanded.expandedFilename, "utf8")
        try {
            const tree: any = this.parser.parseCode(data)
            this.lint.workingDirectory = expanded.workingDirectory
            return this.lint.checkTree(tree, reuse_context, filename)
        } catch(e) {
            if(e.message.match(/^Line/)) { // FIXME
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
        code: string,
        depth: number = 0
    ): Promise<boolean|null> {
        return new Promise((resolve, reject) => {
            try {
                const tree: any = this.parser.parseCode(code)
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
        code: string,
        throw_on_error: boolean = true,
        depth: number = 0
    ): boolean|null {
        const tree: any = this.parser.parseCode(code)
        return this.lint.checkTree(tree)
    }
}