import Context from "../context"
import ContextTypes from "../context-types"
import {PHPTypeUnion} from "../phptype"
import {default as PHPStrictError, PHPContextlessError} from "../phpstricterror"
import * as ShadowTree from "../shadowtree"

/** @type {boolean} True if you want lots of debugging messages */
const DEBUG = false

/**
 * @callback cachePropertyCallback
 * @param {Object} node_property
 * @returns {Object}
 */

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
 export default class _Node {
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
            throw new PHPStrictError(
                `Name ${name} is not defined in this namespace, contents are: ${context.definedVariables.join(", ")}`,
                context,
                loc
            );
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
     * @param {cachePropertyCallback} f
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
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
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
     * Converts PHPContextlessError into PHPStrictError, otherwise just rethrows.
     * @param {Error} e
     * @param {Context} context
     * @throws
     */
    handleException(e, context) {
        if(e instanceof PHPContextlessError) {
            // console.log(this.node)
            throw new PHPStrictError(
                e.message,
                context,
                this.loc
            )
        } else {
            throw e
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