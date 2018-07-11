"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The top-level lint support
 */
class PHPLint {
    /**
     * Checks the file
     */
    static checkFile(filename, depth = 0, working_directory = null) {
        return new Promise(resolve => resolve(null));
    }
    /**
     * Checks the file and maybe throws (or warns)
     * @throws
     */
    static checkFileSync(filename, throw_on_error = true, depth = 0, working_directory = null) {
        return null;
    }
    /**
     * Checks the code
     */
    static checkSourceCode(code, depth = 0) {
        return new Promise(resolve => resolve(null));
    }
    /**
     * Checks the code and maybe throws (or warns)
     * @throws
     */
    static checkSourceCodeSync(code, throw_on_error = true, depth = 0) {
        return null;
    }
    /**
     * Resets any global state, eg. if you're checking multiple different projects
     */
    static resetGlobalState() {
        return this;
    }
}
exports.default = PHPLint;
