import AbstractNode from "./abstract-node"
import Context from "../context"
import {default as DocParser, DocNode} from "../doc-parser"
import * as PHPError from "../php-error"
import * as PHPType from "../php-type"

export default class Doc extends AbstractNode {
    /** @type {boolean} */
    get isDoc() {
        return this.node.isDoc
    }
    /** @type {string[]} */
    get lines() {
        return this.node.lines
    }
    /**
     *
     * @param {PHPType.Union} u
     * @param {Context} context
     * @param {Doc} doc
     */
    resolveAllDocNames(u, context, doc) {
        let types = u.types
        for(let i = 0; i < types.length; i++) {
            let m = types[i]
            if(m instanceof PHPType.AssociativeArray) {
                types = types.concat(m.memberType.types)
            } else if(m instanceof PHPType.IndexedArray) {
                types = types.concat(m.memberType.types)
            } else if(m instanceof PHPType.Simple) {
                m.typeName = this.resolveDocName(m.typeName, context, doc)
            } else if(m instanceof PHPType.Function) {
                m.argTypes.forEach(atype => types = types.concat(atype.types))
                types = types.concat(m.returnType.types)
            } else if(m instanceof PHPType.Mixed) {
                // Do nothing
            } else {
                throw new Error(`Don't know how to resolve doc names in type ${m}`)
            }
        }
    }
    /**
     * @param {string} t
     * @param {Context} context
     * @param {Doc} doc
     * @returns {string}
     */
    resolveDocName(t, context, doc) {
        try {
            if(t.match(/^[A-Z0-9]/)) {
                return (
                    context.fileContext.resolveAliasName(t) ||
                    "\\" + t
                )
            } else if(PHPType.Core.types.hasOwnProperty(t)) {
                return context.resolveName(PHPType.Core.types[t].toString())
            } else {
                return context.resolveName(t, "uqn")
            }
        } catch(e) {
            if(e instanceof PHPType.WrongType) {
                this.throw(new PHPError.BadCoreType(e.message), context, doc.loc)
                return context.resolveName(e.realName)
            } else {
                throw e
            }
        }
    }
    /**
     * @type {DocNode[]}
     */
    get structure() {
        if(!this._structure) {
            this._structure = new DocParser(this.lines).top.children
        }
        return this._structure
    }
}
export {DocTypeNode} from "../doc-parser"