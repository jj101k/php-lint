class DocNode {
    constructor(tag = null) {
        this.children = []
        this.tail = null
        this.kind = tag
    }
    get type() {
        return {
            name: this.tail.replace(/\s.*/, "")
        }
    }
    get what() {
        return {
            name: this.tail.replace(/\s.*/, "")
        }
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
                if(tail && tail.match(/(?:\S.*?)?\s*\{\s*$/)) {
                    node.tail = md[1]
                    parser_state.unshift(node)
                } else {
                    node.tail = tail
                }
            } else if(md = line.match(/^\s*\}\s*$/)) {
                parser_state.shift()
            } else {
                parser_state[0].tail += line
            }
        })
    }
}
export default DocParser