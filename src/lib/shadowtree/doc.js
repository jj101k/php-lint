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
     * Given a type union filled with unqualified names, returns the same with
     * qualified names.
     *
     * @param {PHPType.Union} u
     * @param {Context} context
     * @param {Doc} doc
     * @returns {PHPType.Union}
     */
    resolveAllDocNames(u, context, doc) {
        let n = PHPType.Union.empty
        u.types.map(t => {
            if(t instanceof PHPType.AssociativeArray) {
                return new PHPType.AssociativeArray(
                    this.resolveAllDocNames(t.memberType, context, doc)
                )
            } else if(t instanceof PHPType.IndexedArray) {
                return new PHPType.IndexedArray(
                    this.resolveAllDocNames(t.memberType, context, doc)
                )
            } else if(t instanceof PHPType.Simple) {
                return new PHPType.Simple(
                    this.resolveDocName(t.typeName, context, doc),
                    t.values,
                    t.polyValue
                )
            } else if(t instanceof PHPType.Function) {
                let cbp = {}
                Object.keys(t.callbackPositions).forEach(k => {
                    cbp[k] = this.resolveAllDocNames(t.callbackPositions[k], context, doc)
                })
                return new PHPType.Function(
                    t.argTypes.map(
                        atype => this.resolveAllDocNames(atype, context, doc)
                    ),
                    this.resolveAllDocNames(t.returnType, context, doc),
                    t.passByReferencePositions,
                    cbp
                )
            } else if(t instanceof PHPType.Mixed) {
                // Do nothing
                return t
            } else {
                throw new Error(`Don't know how to resolve doc names in type ${t}`)
            }
        }).forEach(
            t => n.addType(t)
        )
        return n
    }
    /**
     * @param {string} t
     * @param {Context} context
     * @param {Doc} doc
     * @returns {string}
     */
    resolveDocName(t, context, doc) {
        try {
            if(t.match(/^\\/)) {
                return t
            } else if(PHPType.Core.types.hasOwnProperty(t)) {
                return context.resolveName(PHPType.Core.types[t].toString())
            } else {
                return(
                    context.fileContext.resolveAliasName(t) ||
                    context.resolveName(t, "uqn")
                )
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