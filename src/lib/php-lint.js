var phpParser = require("php-parser")

var parser = new phpParser({
    parser: {
        debug: false,
        extractDoc: true,
    },
    ast: {
        withPositions: true,
    },
});

var fs = require("fs")
import Lint from "./lint"
import { GlobalContext } from "./global-context";

class PHPLint {
    /**
     * @type {{[x: number]: number}}
     * @see GlobalContext.depthCounts
     */
    static get depthCounts() {
        return Lint.single.globalContext.depthCounts
    }
    static get parser() {
        return parser
    }
    /**
     * @type {number}
     */
    static get processed() {
        return Lint.single.globalContext.results.length
    }
    /**
     * Checks the file
     * @param {string} filename
     * @param {number} [depth]
     * @param {?string} [working_directory]
     * @returns {Promise} Rejects on failure
     */
    static checkFile(
        filename,
        depth = 0,
        working_directory = null
    ) {
        let lint_single = Lint.single
        return new Promise((resolve, reject) => {
            fs.readFile(filename, "utf8", (err, data) => {
                if(err) {
                    reject(err)
                } else {
                    try {
                        var tree = parser.parseCode(data, filename)
                        resolve(lint_single.checkTree(
                            tree,
                            filename,
                            true,
                            depth,
                            working_directory
                        ))
                    } catch(e) {
                        reject(e)
                    }
                }
            })
        })
    }

    /**
     * Checks the file and maybe throws (or warns)
     * @param {string} filename
     * @param {boolean} [throw_on_error]
     * @param {number} [depth]
     * @param {?string} [working_directory]
     * @throws
     * @returns {?boolean}
     */
    static checkFileSync(
        filename,
        throw_on_error = true,
        depth = 0,
        working_directory = null
    ) {
        if(!depth) depth = 0
        //
        var data = fs.readFileSync(filename, "utf8")
        var tree = parser.parseCode(data, filename)
        return Lint.single.checkTree(
            tree,
            filename,
            throw_on_error,
            depth,
            working_directory
        )
    }

    /**
     * Checks the code
     * @param {string} code
     * @param {number} [depth]
     * @returns {Promise} Rejects on failure
     */
    static checkSourceCode(code, depth = 0) {
        let lint_single = Lint.single
        return new Promise((resolve, reject) => {
            try {
                var tree = parser.parseCode(code)
                resolve(lint_single.checkTree(
                    tree,
                    null,
                    true,
                    depth,
                    null
                ))
            } catch(e) {
                reject(e)
            }
        });
    }

    /**
     * Checks the code and maybe throws (or warns)
     * @param {string} code
     * @param {boolean} [throw_on_error]
     * @param {number} [depth]
     * @throws
     * @returns {?boolean}
     */
    static checkSourceCodeSync(code, throw_on_error = true, depth = 0) {
        var tree = parser.parseCode(code);
        return Lint.single.checkTree(
            tree,
            null,
            throw_on_error,
            depth,
            null
        )
    }
    /**
     * @type {{[x: string]: (boolean|{[y: string]: boolean})}} The error classes to ignore
     */
    static get ignoreErrorMap() {
        return Lint.single.ignoreErrorMap
    }

    static get silenceVendor() {
        return Lint.single.silenceVendor
    }
    static set silenceVendor(v) {
        Lint.single.silenceVendor = v
    }

    /**
     * Resets the global state, eg. if you're checking multiple different projects
     * @return {PHPLint}
     */
    static resetGlobalState() {
        Lint.single = null
        return this
    }
}

export default PHPLint