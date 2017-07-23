var phpParser = require("php-parser");

var parser = new phpParser({
    parser: {
        debug: false,
        extractDoc: false,
    },
    ast: {
        withPositions: true,
    },
});

var fs = require("fs")
import Lint from "./lint"

class PHPLint {
    /**
     * @type {Object.<number,number>}
     * @see GlobalContext.depthCounts
     */
    static get depthCounts() {
        return Lint.globalContext.depthCounts
    }
    /**
     * Checks the file
     * @param {string} filename
     * @param {number} [depth]
     * @returns {Promise} Rejects on failure
     */
    static checkFile(filename, depth = 0) {
        this.processed++
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
     * @throws
     */
    static checkFileSync(filename, throw_on_error = true, depth = 0) {
        if(!depth) depth = 0
        this.processed++
        //
        var data = fs.readFileSync(filename, "utf8")
        var tree = parser.parseCode(data, filename)
        return Lint.check(tree, filename, throw_on_error, depth)
    }

    /**
     * Checks the code
     * @param {string} code
     * @param {number} [depth]
     * @returns {Promise} Rejects on failure
     */
    static checkSourceCode(code, depth = 0) {
        this.processed++
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
     */
    static checkSourceCodeSync(code, throw_on_error = true, depth = 0) {
        this.processed++
        var tree = parser.parseCode(code);
        return Lint.check(tree, null, throw_on_error, depth);
    }
}
/** @type {number} */
PHPLint.processed = 0

export default PHPLint