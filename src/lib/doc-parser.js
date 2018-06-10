import * as PHPType from "./php-type"

/**
 * A tagged (hopefully) doc directive
 */
class DocNode {
    /**
     *
     * @param {?string} tag
     */
    constructor(tag = null) {
        /**
         * @type {DocNode[]}
         */
        this.children = []
        /**
         * @type {?string}
         */
        this.tail = null
        this.kind = tag
        this.type = null
        this.typeStructure = null
    }
    get tail() {
        return this._tail
    }
    set tail(v) {
        this._tail = v
        this.type = {
            name: v && v.split(/[\s\r\n]+/)[0],
        }
    }
    get what() {
        return this.type
    }
    /**
     *
     * @param {?{[tag: string]: function(DocNode)}} [resolver_by_type]
     */
    resolve(resolver_by_type = null) {
        switch(this.kind) {
            case "api":
            case "deprecated":
            case "example":
            case "internal":
            case "link":
            case "see":
            case "throws":
                if(resolver_by_type && resolver_by_type[this.kind]) {
                    resolver_by_type[this.kind](this)
                }
                break
            default:
                console.log(
                    `Skipping unrecognised PHPDoc tag @${this.kind}`
                )
        }
    }
}
/**
 * A token of some kind
 */
class TypeToken {
    /**
     *
     */
    constructor() {
        this.isArray = false
    }
    /**
     * @type {PHPType.Set}
     */
    get type() {
        throw new Error("Not implemented")
    }
}
/**
 * A set of possible tokens
 */
class OptTypeToken extends TypeToken {
    constructor() {
        super()
        /**
         * @type {TypeToken[]}
         */
        this.tokens = []
    }
    /**
     * @type {PHPType.Set}
     */
    get type() {
        let t = PHPType.Union.empty
        this.tokens.forEach(token => t = PHPType.Union.combine(t, token.type))
        if(this.isArray) {
            return new PHPType.IndexedArray(t).union
        } else {
            return t
        }
    }
    add(token) {
        this.tokens.push(token)
    }
}
/**
 * A token with a name
 */
class NamedTypeToken extends TypeToken {
    /**
     *
     * @param {string} name
     */
    constructor(name) {
        super()
        this.name = name
    }
    /**
     * @type {PHPType.Set}
     */
    get type() {
        let t
        if(this.name == "array") {
            t = new PHPType.AssociativeArray(new PHPType.Mixed(null, null, "doc").union).union
        } else if(this.name == "mixed") {
            t = new PHPType.Mixed(null, null, "doc").union
        } else if(this.name == "callable") {
            t = PHPType.Core.types.callable
        } else {
            t = new PHPType.Simple(this.name).union
        }
        if(this.isArray) {
            return new PHPType.IndexedArray(t).union
        } else {
            return t
        }
    }
}
/**
 * A doc directive that has a PHP type
 */
class DocTypeNode extends DocNode {
    get type() {
        return this._type
    }
    set type(v) {
        this._type = v
        if(v && v.name) {
            /**
             * @type {string}
             */
            let name = v.name
            /**
             * @type {OptTypeToken[]}
             */
            let tokens = []
            let current_token = new OptTypeToken()
            /**
             * @type {TypeToken}
             */
            let last_token = null
            let i = 0
            while(name.length && i < 10) {
                i++
                //console.log(name)
                name = name.replace(
                    /^\(/,
                    () => {
                        let new_token = new OptTypeToken()
                        current_token.add(new_token)
                        tokens.push(current_token)
                        current_token = new_token
                        return ""
                    }
                ).replace(
                    /^\|/,
                    () => {
                        return ""
                    }
                ).replace(
                    /^([\w\\$]+)/,
                    (s, md1) => {
                        last_token = new NamedTypeToken(md1)
                        current_token.add(last_token)
                        return ""
                    }
                ).replace(
                    /^[)]/,
                    () => {
                        last_token = current_token
                        current_token = tokens.pop()
                        return ""
                    }
                ).replace(
                    /^\[\]/,
                    () => {
                        last_token.isArray = true
                        return ""
                    }
                )
            }
            if(i == 10) {
                throw new Error(`Infinite loop parsing ${v.name}?`)
            }
            this.typeStructure = current_token.type
        } else {
            this.typeStructure = new PHPType.Mixed(null, null, "doc").union
        }
    }
    /**
     *
     * @param {?{[tag: string]: function(DocTypeNode)}} [resolver_by_type]
     */
    resolve(resolver_by_type = null) {
        if(resolver_by_type && resolver_by_type[this.kind]) {
            resolver_by_type[this.kind](this)
        } else {
            console.log(
                `Skipping unrecognised PHPDoc tag @${this.kind}`
            )
        }
    }
}
/**
 * Parse the doc
 */
class DocParser {
    /**
     * Builds the object.
     *
     * @param {string[]} lines
     */
    constructor(lines) {
        this.sourceText = lines.join("\n")
        this.top = new DocNode()
        let parser_state = [this.top]
        lines.forEach(line => {
            let md
            if(md = line.match(/^\s*@(\w+)(?:\s+(\S.*))?/)) {
                let tag = md[1]
                let tail = md[2]
                let node
                switch(tag) {
                    case "param":
                    case "property":
                    case "return":
                    case "var":
                        node = new DocTypeNode(tag)
                        break
                    default:
                        node = new DocNode(tag)
                }
                parser_state[0].children.push(node)
                let mdx
                if(tail && (mdx = tail.match(/(\S.*?)?\s*\{\s*$/))) {
                    node.tail = mdx[1]
                    parser_state.unshift(node)
                } else {
                    node.tail = tail
                }
            } else if(parser_state.length > 1 && (md = line.match(/^\s*\}\s*$/))) {
                parser_state.shift()
            } else {
                parser_state[0].tail += "\n" + line
            }
        })
    }
}
export default DocParser
export {DocNode, DocTypeNode}