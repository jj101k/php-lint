import * as phpParser from "php-parser"
import * as fs from "fs"

import Lint from "./lint"
/**
 * The top-level lint support
 */
export default class PHPLint {
    private _lint: Lint|null = null
    private _parser: phpParser.default | null = null

    protected get lint(): Lint {
        if(!this._lint) {
            this._lint = new Lint()
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
     * Checks the file
     *
     * @param depth How far recursion has gone. Very deep code may be skipped.
     */
    checkFile(
        filename: string,
        depth: number = 0,
        working_directory: string|null = null
    ): Promise<boolean|null> {
        return new Promise<boolean|null>((resolve, reject) => {
            fs.readFile(filename, "utf8", (err, data) => {
                if(err) {
                    reject(err)
                } else {
                    try {
                        const tree: any = this.parser.parseCode(data)
                        resolve(this.lint.checkTree(tree))
                    } catch(e) {
                        reject(e)
                    }
                }
            })
        }).catch(
            e => {
                if(e.message.match(/^Line/)) { // FIXME
                    console.log(new Error(`${filename}: ${e.message}`))
                } else {
                    console.log(e)
                }
                return null
            }
        )
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
        working_directory: string|null = null
    ): boolean|null {
        const data = fs.readFileSync(filename, "utf8")
        try {
            const tree: any = this.parser.parseCode(data)
            return this.lint.checkTree(tree)
        } catch(e) {
            if(e.message.match(/^Line/)) { // FIXME
                throw new Error(`${filename}: ${e.message}`)
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