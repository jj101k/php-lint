import { isNumber } from "util";
import { Base } from "./base";
import { Int } from "./int";

/**
 * A general PHP array
 */
export class BaseArray extends Base {
    get shortType() {
        return "array"
    }
    set(key, value) {
        throw new Error("Not implemented")
    }
}

/**
 * A key-value map of things
 */
export class AssociativeArray extends BaseArray {
    cursor = 0
    get combinePriority() {
        return -Infinity
    }
    content
    otherValue = null
    constructor(from = null) {
        super()
        if(from instanceof IndexedArray) {
            if(from.content) {
                const m = new Map()
                for(const [i, v] of Object.entries(from.content)) {
                    m.set(i, v)
                }
                this.content = m
            } else {
                this.content = null
            }
        } else if(from) {
            this.content = from.content
            this.otherValue = from.otherValue
        } else {
            this.content = null
        }
    }
    set(key, value) {
        if(key) {
            if(key) {
                if(!this.content) this.content = new Map()
                if(isNumber(key) && +key > this.cursor) {
                    this.cursor = +key
                }
                this.content.set("" + key, value)
            } else {
                this.otherValue = this.otherValue ?
                    this.otherValue.combinedWith(value) :
                    value
            }
        } else {
            if(!this.content) this.content = new Map()
            this.content.set("" + this.cursor, value)
            this.cursor++
        }
        return this
    }
}

/**
 * An array of things
 */
export class IndexedArray extends BaseArray {
    get combinePriority() {
        return -Infinity
    }
    content
    constructor(content = null) {
        super()
        this.content = content
    }
    get cursor() {
        return this.content ? this.content.length : 0
    }
    get memberType() {
        if(this.content && this.content.length) {
            return this.content[0] // FIXME
        } else {
            return null
        }
    }
    matches(type) {
        if(type instanceof IndexedArray) {
            return !(
                this.memberType &&
                type.memberType &&
                !this.memberType.matches(type.memberType)
            )
        } else {
            return super.matches(type)
        }
    }
    set(key, value) {
        if(key) {
            if(
                key instanceof Int &&
                key.value !== null
            ) {
                if(!this.content) this.content = []
                this.content[+key] = value
                return this
            } else {
                const n = new AssociativeArray(this)
                return n.set(key, value)
            }
        } else {
            if(!this.content) this.content = []
            this.content.push(value)
            return this
        }
    }
}