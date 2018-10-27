import { isNumber } from "util";
import { Base } from "./base";
import { Int } from "./int";

/**
 * A general PHP array
 */
export abstract class BaseArray extends Base {
    abstract set(key: Base[] | null, value: Base[]): BaseArray
}

/**
 * A key-value map of things
 */
export class AssociativeArray extends BaseArray {
    public cursor: number = 0
    public content: Map<string, Base[]> | null
    public otherValues: Base[] = []
    constructor(from: AssociativeArray | IndexedArray | null = null) {
        super()
        if(from instanceof IndexedArray) {
            if(from.content) {
                const m: Map<string, Base[]> = new Map()
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
    set(key: Base[] | null, value: Base[]): BaseArray {
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
    public content: Base[][] | null
    constructor(content: Base[][] | null = null) {
        super()
        this.content = content
    }
    get cursor() {
        return this.content ? this.content.length : 0
    }
    set(key: Base[] | null, value: Base[]): BaseArray {
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