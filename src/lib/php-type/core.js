import _Any from "./any"
import _AssociativeArray from "./associative-array"
import _Mixed from "./mixed"
import _Simple from "./simple"
import _Set from "./set"
import _Function from "./function";
/**
 * @typedef coreTypes
 * @property {_Set} string
 * @property {_Set} int
 * @property {_Set} float
 * @property {_Set} bool
 * @property {_Set} array
 * @property {_Set} callable
 * @property {_Set} null
 * @property {_Set} self
 * @property {_Set} object
 * @property {_Set} void
 */

/**
 * Lightweight exception to express type name misses
 */
class WrongType extends Error {
    /**
     *
     * @param {string} supplied_name
     * @param {string} real_name
     */
    constructor(supplied_name, real_name) {
        super(`'${real_name}' incorrectly referred to as '${supplied_name}'`)
        this.suppliedName = supplied_name
        this.realName = real_name
    }
}

/**
 * A simple type expression (eg string, int)
 */
export default class _Core {
    /** @type {{[x: string]: _Set}} */
    static get namedTypes() {
        if(!this._namedTypes) {
            this._namedTypes = {}
        }
        return this._namedTypes
    }
    /** @type {coreTypes} */
    static get types() {
        if(!this._coreTypes) {
            let known_types = ["string", "int", "float", "bool"]
            let pseudo_types = ["null", "self", "object", "void"]
            /**
             * @type {{[x: string]: _Set}}
             */
            let types = {}
            known_types.forEach(
                type_name => types[type_name] = new _Simple(type_name).union
            )
            pseudo_types.forEach(
                type_name => types[type_name] = new _Simple(type_name).union
            )
            types.callable = new _Function(
                [],
                new _Mixed(null, null, "~callable#out").union
            ).union
            types.array = new _AssociativeArray(new _Mixed(null, null, "~array").union).union
            Object.defineProperty(types, "boolean", {
                get() {
                    throw new WrongType("boolean", "bool")
                }
            })
            Object.defineProperty(types, "integer", {
                get() {
                    throw new WrongType("integer", "int")
                }
            })
            Object.defineProperty(types, "this", {
                get() {
                    throw new WrongType("this", "self")
                }
            })
            Object.defineProperty(types, "$this", {
                get() {
                    throw new WrongType("$this", "self")
                }
            })
            Object.freeze(types)
            this._coreTypes = types
        }
        return this._coreTypes
    }
    /**
     * Returns a cached type by name
     *
     * @param {string} type_name A fully qualified canonical name
     * @returns {_Set}
     */
    static named(type_name) {
        if(this.types[type_name]) {
            return this.types[type_name]
        }
        if(!this.namedTypes[type_name]) {
            this.namedTypes[type_name] = new _Simple(type_name).union
        }
        return this.namedTypes[type_name]
    }
}
export {WrongType}