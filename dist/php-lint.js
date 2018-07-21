"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const phpParser = __importStar(require("php-parser"));
const fs = __importStar(require("fs"));
const lint_1 = __importDefault(require("./lint"));
const parser = new phpParser.default({
    parser: {
        debug: false,
        extractDoc: true,
    },
    ast: {
        withPositions: true,
    },
});
/**
 * The top-level lint support
 */
class PHPLint {
    constructor() {
        this._lint = null;
    }
    get lint() {
        if (!this._lint) {
            this._lint = new lint_1.default();
        }
        return this._lint;
    }
    /**
     * Checks the file
     *
     * @param depth How far recursion has gone. Very deep code may be skipped.
     */
    checkFile(filename, depth = 0, working_directory = null) {
        return new Promise((resolve, reject) => {
            fs.readFile(filename, "utf8", (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    try {
                        const tree = parser.parseCode(data);
                        resolve(this.lint.checkTree(tree));
                    }
                    catch (e) {
                        reject(e);
                    }
                }
            });
        });
    }
    /**
     * Checks the file and maybe throws (or warns)
     *
     * @param depth How far recursion has gone. Very deep code may be skipped.
     * @throws
     */
    checkFileSync(filename, throw_on_error = true, depth = 0, working_directory = null) {
        const data = fs.readFileSync(filename, "utf8");
        const tree = parser.parseCode(data);
        return this.lint.checkTree(tree);
    }
    /**
     * Checks the code
     *
     * @param depth How far recursion has gone. Very deep code may be skipped.
     */
    checkSourceCode(code, depth = 0) {
        return new Promise((resolve, reject) => {
            try {
                const tree = parser.parseCode(code);
                resolve(this.lint.checkTree(tree));
            }
            catch (e) {
                reject(e);
            }
        });
    }
    /**
     * Checks the code and maybe throws (or warns)
     *
     * @param depth How far recursion has gone. Very deep code may be skipped.
     * @throws
     */
    checkSourceCodeSync(code, throw_on_error = true, depth = 0) {
        const tree = parser.parseCode(code);
        return this.lint.checkTree(tree);
    }
}
exports.default = PHPLint;
