import * as PHPError from "../php-error"
import Context from "../context"

/**
 * @typedef ParserPosition
 * @property {number} line
 * @property {number} column
 * @property {number} offset
 */
/**
 * @typedef ParserLocation
 * @property {?string} source
 * @property {ParserPosition} start
 * @property {ParserPosition} end
 */

/**
 * @type {Function[]} The errors to ignore
 */
let ignoreErrors = []

/**
 * @type {string[]}
 */
let silenceVendor = []

export default class AbstractNode {
    /**
     * @type {{[x: string]: (boolean|{[y: string]: boolean})}} The error classes to ignore
     */
    static get ignoreErrorMap() {
        if(!this._ignoreErrorMap) {
            let out = {}
            for(let k in PHPError) {
                if(PHPError[k] instanceof Function) {
                    Object.defineProperty(out, k, {
                        enumerable: true,
                        get: () => ignoreErrors.some(e => e === PHPError[k]),
                        set: v => {
                            ignoreErrors = ignoreErrors.filter(e => e !== PHPError[k])
                            if(v) {
                                ignoreErrors.push(PHPError[k])
                            }
                        }
                    })
                } else {
                    let out_k = {}
                    Object.defineProperty(out, k, {
                        enumerable: true,
                        get: () => out_k
                    })
                    for(let m in PHPError[k]) {
                        Object.defineProperty(out_k, m, {
                            enumerable: true,
                            get: () => ignoreErrors.some(e => e === PHPError[k][m]),
                            set: v => {
                                ignoreErrors = ignoreErrors.filter(e => e !== PHPError[k][m])
                                if(v) {
                                    ignoreErrors.push(PHPError[k][m])
                                }
                            }
                        })
                    }
                }
            }
            Object.freeze(out)
            this._ignoreErrorMap = out
        }
        return this._ignoreErrorMap
    }
    static get silenceVendor() {
        return silenceVendor
    }
    static set silenceVendor(v) {
        silenceVendor = v
    }
    /**
     * Builds the object
     *
     * @param {*} node
     */
    constructor(node) {
        this._cache = {}
        this.node = node
    }
    /** @type {string} */
    get kind() {
        return this.node.kind;
    }
    /** @type {?ParserLocation} */
    get loc() {
        return this.node.loc;
    }
    /**
     * Returns a cached copy of the named property, calling f(node_property)
     * if needed.
     * @param {string} name
     * @param {function(*): *} f
     * @returns {Object}
     */
    cacheProperty(name, f) {
        if(!this._cache.hasOwnProperty(name)) {
            this._cache[name] = f(this.node[name]);
        }
        return this._cache[name];
    }
    /**
     * Wraps throwing. This may conditionally not throw.
     * @param {PHPError.Error} e
     * @param {Context} context
     * @param {?ParserLocation} [effective_location]
     * @throws {PHPError.Error}
     */
    throw(e, context, effective_location = null) {
        if(
            context.fileContext &&
            silenceVendor.some(
                sv => context.fileContext.filename.startsWith(
                    context.globalContext.workingDirectory + "/" + sv + "/"
                )
            )
        ) {
            // Skip
        } else if(ignoreErrors.every(o => !(e instanceof o))) {
            throw e.withContext(context, this, effective_location)
        }
    }
}