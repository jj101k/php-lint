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
        return Lint.globalContext.depthCounts
    }
    static get parser() {
        return parser
    }
    /**
     * @type {number}
     */
    static get processed() {
        return Lint.globalContext.results.length
    }
    /**
     * Checks the file
     * @param {string} filename
     * @param {number} [depth]
     * @param {?string} [working_directory]
     * @param {boolean} [reuse_global_context]
     * @returns {Promise} Rejects on failure
     */
    static checkFile(
        filename,
        depth = 0,
        working_directory = null,
        reuse_global_context = true
    ) {
        return new Promise((resolve, reject) => {
            fs.readFile(filename, "utf8", (err, data) => {
                if(err) {
                    reject(err)
                } else {
                    try {
                        var tree = parser.parseCode(data, filename)
                        resolve(Lint.check(
                            tree,
                            filename,
                            true,
                            depth,
                            working_directory,
                            reuse_global_context
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
     * @param {boolean} [reuse_global_context]
     * @throws
     * @returns {?boolean}
     */
    static checkFileSync(
        filename,
        throw_on_error = true,
        depth = 0,
        working_directory = null,
        reuse_global_context = true
    ) {
        if(!depth) depth = 0
        //
        var data = fs.readFileSync(filename, "utf8")
        var tree = parser.parseCode(data, filename)
        return Lint.check(
            tree,
            filename,
            throw_on_error,
            depth,
            working_directory,
            reuse_global_context
        )
    }

    /**
     * Checks the code
     * @param {string} code
     * @param {number} [depth]
     * @returns {Promise} Rejects on failure
     */
    static checkSourceCode(code, depth = 0) {
        //
        return new Promise((resolve, reject) => {
            try {
                var tree = parser.parseCode(code)
                resolve(Lint.check(
                    tree,
                    null,
                    true,
                    depth,
                    null,
                    false
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
        return Lint.check(
            tree,
            null,
            throw_on_error,
            depth,
            null,
            false
        )
    }
    /**
     * @type {{[x: string]: (boolean|{[y: string]: boolean})}} The error classes to ignore
     */
    static get ignoreErrorMap() {
        return Lint.ignoreErrorMap
    }

    /**
     * Resets the global state, eg. if you're checking multiple different projects
     */
    static resetGlobalState() {
        Lint.globalContext = new GlobalContext()
    }
}

export default PHPLint