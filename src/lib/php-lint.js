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
        return Object.keys(Lint.globalContext.depths).length
    }
    /**
     * Checks the file
     * @param {string} filename
     * @param {number} [depth]
     * @returns {Promise} Rejects on failure
     */
    static checkFile(filename, depth = 0) {
        return new Promise((resolve, reject) => {
            fs.readFile(filename, "utf8", (err, data) => {
                if(err) {
                    reject(err)
                } else {
                    try {
                        var tree = parser.parseCode(data, filename)
                        resolve(Lint.check(tree, filename, true, depth))
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
    static checkFileSync(filename, throw_on_error = true, depth = 0, working_directory = null) {
        if(!depth) depth = 0
        //
        var data = fs.readFileSync(filename, "utf8")
        var tree = parser.parseCode(data, filename)
        return Lint.check(tree, filename, throw_on_error, depth, working_directory)
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
                resolve(Lint.check(tree, null, true, depth))
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
        return Lint.check(tree, null, throw_on_error, depth);
    }
    /**
     * @type {{[x: string]: (boolean|{[y: string]: boolean})}} The error classes to ignore
     */
    static get ignoreErrorMap() {
        return Lint.ignoreErrorMap
    }
}

export default PHPLint