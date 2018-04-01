//import Doc from "./doc"
import Context from "../context"
import ContextTypes from "../context-types"
import {PHPTypeUnion} from "../phptype"
import * as PHPError from "../php-error"
import * as ShadowTree from "../shadowtree"

/** @type {boolean} True if you want lots of debugging messages */
const DEBUG = false

/**
 * @typedef ParserNode
 * @property {function} constructor
 * @property {string} kind
 * @property {?ParserLocation} loc
 */
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
 * @typedef parserStateOptions
 * @property {boolean} [inAssignment]
 * @property {boolean} [inCall]
 */

/**
 * @type {Function[]} The errors to ignore
 */
let ignoreErrors = []

export default class _Node {
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
    /**
     * Builds the shadow node
     * @param {ParserNode} node
     */
    constructor(node) {
        this._cache = {}
        /** @type {Object} */
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
     * Returns the types for the local name, or throws
     * @param {Context} context
     * @param {string} name
     * @returns {?PHPTypeUnion}
     */
    assertHasName(context, name) {
        var types = context.findName(name)
        if(!types) {
            let loc = this.loc
            if(!loc) {
                loc = Object.keys(this.node).map(
                    k => this.node[k] && this.node[k].loc
                ).find(l => l)
            }
            this.throw(new PHPError.UndefinedVariable(
                `Name ${name} is not defined in this namespace, contents are: ${context.definedVariables.join(", ")}`
            ), context)
        }
        return types
    }
    /**
     * Returns a shadow tree node wrapping the given node (caches)
     * @param {string} name
     * @returns {?_Node}
     */
    cacheNode(name) {
        return this.cacheProperty(
            name,
            subnode => subnode ?
                _Node.typed(subnode) :
                subnode
        );
    }
    /**
     * Returns a nominal array of shadow tree nodes wrapping the given nodes
     * (caches)
     * @param {string} name
     * @returns {?_Node[]}
     */
    cacheNodeArray(name) {
        return this.cacheProperty(
            name,
            subnodes => subnodes ? subnodes.map(
                subnode => _Node.typed(subnode)
            ) : subnodes
        );
    }
    /**
     * Like cacheNode, but includes cases where random other objects are present.
     * @param {string} name
     * @returns {_Node|*}
     */
    cacheOptionalNode(name) {
        if(this.node[name] && this.node[name].kind) {
            return this.cacheNode(name)
        } else {
            return this.node[name]
        }
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
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {parserStateOptions} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = {}, doc = null) {
        if(DEBUG) {
            if(this.loc) {
                console.info(`Checking ${context.fileContext.filename}:${this.loc.start.line}:${this.loc.start.column}:${this.kind}`)
            } else {
                console.info(`Checking ${context.fileContext.filename}:?:?:${this.kind}`)
            }
        }
        return new ContextTypes(PHPTypeUnion.empty)
    }
    /**
     * Converts PHPError.Error into PHPStrictError, otherwise just rethrows.
     * @param {Error} e
     * @param {Context} context
     * @throws
     */
    handleException(e, context) {
        if(e instanceof PHPError.Error) {
            // console.log(this.node)
            this.throw(e, context)
        } else {
            throw e
        }
    }
    /**
     * Wraps throwing. This may conditionally not throw.
     * @param {PHPError.Error} e
     * @param {Context} context
     * @throws {PHPError.Error}
     */
    throw(e, context) {
        if(ignoreErrors.every(o => !(e instanceof o))) {
            throw e.withContext(context, this)
        }
    }
    /**
     * Returns the shadow tree counterpart of the given node.
     * @param {ParserNode} node
     * @returns {_Node}
     */
    static typed(node) {
        var c = ShadowTree[node.constructor.name] ||
            ShadowTree[node.constructor.name.replace(/^_/, "")]
        if(!c) {
            throw new Error(`No handler for ${node.constructor.name}`);
        }
        return new c(node);
    }
}
