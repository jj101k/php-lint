import _Any from "./any"
import _AssociativeArray from "./associative-array"
import _Mixed from "./mixed"
import _Simple from "./simple"
import _Union from "./union"
/**
 * @typedef coreTypes
 * @property {_Union} string
 * @property {_Union} int
 * @property {_Union} float
 * @property {_Union} bool
 * @property {_Union} array
 * @property {_Union} callable
 * @property {_Union} null
 * @property {_Union} mixed
 * @property {_Union} self
 * @property {_Union} object
 * @property {_Union} void
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
    /** @type {{[x: string]: _Union}} */
    static get namedTypes() {
        if(!this._namedTypes) {
            this._namedTypes = {}
        }
        return this._namedTypes
    }
    /** @type {coreTypes} */
    static get types() {
        if(!this._coreTypes) {
            let known_types = ["string", "int", "float", "bool", "callable"]
            let pseudo_types = ["null", "self", "object", "void"]
            let types = {}
            known_types.forEach(
                type_name => types[type_name] = new _Simple(type_name).union
            )
            pseudo_types.forEach(
                type_name => types[type_name] = new _Simple(type_name).union
            )
            types.mixed = new _Mixed().union
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
     * @returns {_Union}
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