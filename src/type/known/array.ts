import { isNumber } from "util";
import * as Type from "../../type"
import { Base } from "./base";
import { Int } from "./int";

/**
 * A general PHP array
 */
export abstract class BaseArray extends Base {
    get shortType() {
        return "array"
    }
    abstract set(key: Array<Type.Base> | null, value: Array<Type.Base>): BaseArray
}

/**
 * A key-value map of things
 */
export class AssociativeArray extends BaseArray {
    public cursor: number = 0
    public content: Map<string, Array<Type.Base>> | null
    public otherValues: Array<Type.Base> = []
    constructor(from: AssociativeArray | IndexedArray | null = null) {
        super()
        if(from instanceof IndexedArray) {
            if(from.content) {
                const m: Map<string, Array<Type.Base>> = new Map()
                for(const [i, v] of Object.entries(from.content)) {
                    m.set(i, v)
                }
                this.content = m
            } else {
                this.content = null
            }
        } else if(from) {
            this.content = from.content
            this.otherValues = from.otherValues
        } else {
            this.content = null
        }
    }
    set(key: Array<Type.Base> | null, value: Array<Type.Base>): BaseArray {
        if(key) {
            if(key.length == 1) {
                const single_key = key[0]
                if(!this.content) this.content = new Map()
                if(isNumber(single_key) && +single_key > this.cursor) {
                    this.cursor = +single_key
                }
                this.content.set("" + single_key, value)
            } else {
                this.otherValues = this.otherValues.concat(value)
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
    public content: Array<Type.Base>[] | null
    constructor(content: Array<Type.Base>[] | null = null) {
        super()
        this.content = content
    }
    get cursor() {
        return this.content ? this.content.length : 0
    }
    get memberType() {
        return null // FIXME
    }
    matches(type: Type.Base): boolean {
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
    set(key: Array<Type.Base> | null, value: Array<Type.Base>): BaseArray {
        if(key) {
            let single_key
            if(
                key.length == 1 &&
                (single_key = key[0]) &&
                single_key instanceof Int &&
                single_key.value !== null
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