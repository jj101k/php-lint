import { NodeTypes } from "../ast";
import { Context } from "../../context"
import * as Known from "../../type/known";
import { Argument } from "../../type/known/function";

/**
 *
 * @param context The effective PHP state machine context
 * @param node The node to examine
 * @returns A set of possible different expression types. If an unknown thing
 * would be returned, this should be just [Known.Base]; if no thing would be
 * returned, this should be []. Anything which cannot be to the right of "="
 * should be [].
 */
export function checkForNode(context: Context, node: NodeTypes.Node): Array<Known.Base> {
    if(node.kind == "array") {
        let out: Known.BaseArray = new Known.IndexedArray()
        for(const i of node.items) {
            let key = null
            if(i.kind == "entry" && i.key) {
                key = context.check(i.key)
            }
            const v = context.check(i)
            out = out.set(key, v)
        }
        return [out]
    } else if(node.kind == "assign") {
        context.check(node.left, true)
        return context.check(node.right)
    } else if(node.kind == "bin") {
        // node.type
        context.check(node.left)
        const rtypes = context.check(node.right)
        switch(node.type) {
            case "!=":
            case "!==":
            case "&&":
            case "<":
            case "<=":
            case "==":
            case "===":
            case ">":
            case ">=":
            case "and":
            case "instanceof":
            case "or":
            case "xor":
            case "||":
                return [
                    new Known.Bool(true),
                    new Known.Bool(false)
                ];
            case "<=>":
                return [
                    new Known.Int(-1),
                    new Known.Int(0),
                    new Known.Int(1)
                ];
            case "%":
            case "&":
            case "<<":
            case ">>":
            case "^":
            case "|":
                return [
                    new Known.Int()
                ]
            case "*":
            case "**":
            case "+":
            case "-":
            case "/":
                // TODO recognise float promotion
                return [
                    new Known.Float()
                ]
            case ".":
                return [
                    new Known.String()
                ]
            case "??":
                return rtypes
        }
    } else if(node.kind == "block") {
        node.children.forEach(
            child => context.check(child)
        )
        return []
    } else if(node.kind == "boolean") {
        return [
            new Known.Bool(node.value)
        ]
    } else if(node.kind == "call") {
        let function_type: Known.Function | null = null
        if(node.what) {
            context.check(node.what)
            if(typeof node.what.name == "string") {
                const type = context.get(node.what.name)
                if(type instanceof Known.Function) {
                    function_type = type
                }
            }
        }
        if(function_type) {
            for(const [i, a] of Object.entries(function_type.args)) {
                if(!a.hasDefaultValue) {
                    if(node.arguments.length < +i + 1) { // TODO not clear why this is a string
                        throw new Error("Not enough arguments for call")
                    }
                }
            }
            node.arguments.forEach((a, i) => {
                if(function_type && function_type.args[i] && function_type.args[i].byRef) {
                    context.check(a, true)
                } else {
                    context.check(a)
                }
            })
            if(function_type.returnType) {
                return [function_type.returnType]
            } else {
                return []
            }
        } else {
            node.arguments.forEach((a, i) => {
                if(function_type && function_type.args[i] && function_type.args[i].byRef) {
                    context.check(a, true)
                } else {
                    context.check(a)
                }
            })
            return [new Known.Base()]
        }
    } else if(node.kind == "class") {
        node.body.forEach(
            b => context.check(b)
        )
        // node.extends
        // node.implements
        // node.isAbstract
        // node.isAnonymous
        // node.isFinal
        if(node.name.length <= 1) {
            throw new Error("Single-character class names are too likely to conflict")
        } else if(!node.name.match(/^([A-Z0-9][a-z0-9]*)+$/)) {
            throw new Error("PSR1 3: class names must be in camel case")
        }
        return []
    } else if(node.kind == "classconstant") {
        // node.isStatic
        // node.name
        if(node.value) {
            context.check(node.value)
        }
        // node.visibility
        return []
    } else if(node.kind == "closure") {
        const inner_context = new Context()
        node.arguments.forEach(
            a => inner_context.check(a)
        )
        // node.byref
        // node.isStatic
        // node.nullable
        node.uses.forEach(u => {
            context.check(u)
            inner_context.check(u, true)
        })
        inner_context.check(node.body)
        return [
            new Known.Function(
                node.arguments.map(a => new Argument(
                    new Known.Base(),
                    a.byref,
                    !!a.value
                )),
                // FIXME return
            )
        ]
    } else if(node.kind == "constref") {
        // node.name
        return [new Known.Base()] // FIXME
    } else if(node.kind == "echo") {
        node.arguments.forEach(
            n => context.check(n)
        )
        // node.shortForm
        return []
    } else if(node.kind == "entry") {
        if(node.key) {
            context.check(node.key)
        }
        return context.check(node.value)
    } else if(node.kind == "foreach") {
        if(node.key) {
            context.check(node.key, true)
        }
        context.check(node.value, true)
        context.check(node.body)
        // node.shortForm
        context.check(node.source)
        return []
    } else if(node.kind == "function") {
        const inner_context = new Context()
        node.arguments.forEach(
            a => inner_context.check(a)
        )
        if(node.body) {
            inner_context.check(node.body)
        }
        context.set(node.name, new Known.Function(
            node.arguments.map(a => new Argument(
                new Known.Base(),
                a.byref,
                !!a.value
            )),
            // FIXME return
        ))
        // node.byref
        // node.nullable
        return []
    } else if(node.kind == "identifier") {
        // node.name
        // node.resolution
        return [new Known.Base()] // FIXME
    } else if(node.kind == "if") {
        if(node.alternate) {
            context.check(node.alternate)
        }
        context.check(node.body)
        context.check(node.test)
        // node.shortForm
        return []
    } else if(node.kind == "include") {
        // node.once
        // node.require
        context.check(node.target)
        return [
            new Known.Bool(true),
            new Known.Bool(false)
        ]
    } else if(node.kind == "isset") {
        node.arguments.forEach(
            n => context.check(n)
        )
        return [
            new Known.Bool(true),
            new Known.Bool(false)
        ]
    } else if(node.kind == "method") {
        const inner_context = new Context()
        if(!node.isStatic) {
            inner_context.set("$this", new Known.Base()) // FIXME
        }
        node.arguments.forEach(
            a => inner_context.check(a)
        )
        if(node.body) {
            inner_context.check(node.body)
        }
        // node.byref
        // node.nullable
        // node.isAbstract
        // node.isFinal
        // node.visibility
        if(!node.name.match(/^[a-z]+([A-Z0-9][a-z0-9]*)*$/)) {
            throw new Error("PSR1 4.3: method names must be in camel case (lower)")
        }
        return []
    } else if(node.kind == "namespace") {
        // node.name
        // node.withBrackets
        return []
    } else if(node.kind == "new") {
        context.check(node.what)
        node.arguments.forEach(
            a => context.check(a)
        )
        return [new Known.Base()] // FIXME
    } else if(node.kind == "number") {
        // node.raw
        // node.value
        if(Math.floor(node.value) == node.value) {
            return [new Known.Int(node.value)]
        } else {
            return [new Known.Float(node.value)]
        }
    } else if(node.kind == "parameter") {
        // node.byref
        // node.nullable
        if(node.type) {
            context.check(node.type)
        }
        if(node.value) {
            context.check(node.value)
        }
        // node.variadic
        context.set("$" + node.name, new Known.Base())
        return []
    } else if(node.kind == "parenthesis") {
        return context.check(node.inner)
    } else if(node.kind == "program") {
        node.children.forEach(
            child => context.check(child)
        )
        return []
    } else if(node.kind == "property") {
        // node.isFinal
        // node.isStatic
        // node.name
        if(node.value) {
            context.check(node.value)
        }
        // node.visibility
        return []
    } else if(node.kind == "propertylookup") {
        context.check(node.what)
        context.check(node.offset)
        return [
            new Known.Base()
        ] // FIXME
    } else if(node.kind == "return") {
        if(node.expr) {
            return context.check(node.expr)
        } else {
            return []
        }
    } else if(node.kind == "staticlookup") {
        context.check(node.what)
        context.check(node.offset)
        return [
            new Known.Base()
        ] // FIXME
    } else if(node.kind == "string") {
        // node.raw
        // node.value
        return [
            new Known.String(node.raw)
        ]
    } else if(node.kind == "traituse") {
        if(node.adaptations) {
            node.adaptations.forEach(
                a => context.check(a)
            )
        }
        node.traits.forEach(
            t => context.check(t)
        )
        return []
    } else if(node.kind == "unary") {
        // node.type
        context.check(node.what)
        return [
            new Known.Base()
        ] // FIXME
    } else if(node.kind == "variable") {
        // this.node.curly
        if(typeof node.name == "string") {
            const name = "$" + node.name
            if(context.assigning) {
                context.set(name, new Known.Base())
            } else {
                if(node.byref && !context.has(name)) {
                    context.set(name, new Known.Base())
                }
                context.assert(
                    node,
                    context.has(name),
                    `Unassigned variable ${name}`
                )
            }
        }
        return [new Known.Base()] // FIXME
    }
}
