import AbstractNode from "./abstract-node"
import Context from "../context"
import ContextTypes from "../context-types"
import Doc from "./doc"
import * as ParserStateOption from "../parser-state-option"
import * as PHPType from "../php-type"
import * as PHPError from "../php-error"
import * as ShadowTree from "../shadowtree"

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

/** @type {boolean} True if you want lots of debugging messages */
const DEBUG = false

/**
 * @typedef ParserNode
 * @property {function} constructor
 * @property {string} kind
 * @property {?ParserLocation} loc
 */

/**
 * @type {Function[]} The errors to ignore
 */
let ignoreErrors = []

/**
 * @type {string[]}
 */
let silenceVendor = []

export default class _Node extends AbstractNode {
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
    /**
     * Builds the shadow node
     * @param {ParserNode} node
     */
    constructor(node) {
        super(node)
    }
        /**
     * Returns the types for the local name, or throws
     * @param {Context} context
     * @param {string} name
     * @returns {?PHPType.Union}
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
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        if(DEBUG) {
            if(this.loc) {
                console.info(`Checking ${context.fileContext.filename}:${this.loc.start.line}:${this.loc.start.column}:${this.kind}`)
            } else {
                console.info(`Checking ${context.fileContext.filename}:?:?:${this.kind}`)
            }
        }
        return new ContextTypes(PHPType.Union.empty)
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
     * @param {?ParserLocation} [effective_location]
     * @throws {PHPError.Error}
     */
    throw(e, context, effective_location = null) {
        if(
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

export {Doc, Context, ContextTypes, ParserStateOption}