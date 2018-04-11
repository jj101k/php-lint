class DocNode {
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
    }
    get tail() {
        return this._tail
    }
    set tail(v) {
        this._tail = v
        this.type = {
            name: v && v.split(/[\s\r\n]/)[0],
        }
    }
    get what() {
        return this.type
    }
}
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
                let node = new DocNode(tag)
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
export {DocNode}