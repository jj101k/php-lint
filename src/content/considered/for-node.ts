import { NodeTypes } from "../ast";
import { Context } from "../../context"
import * as Known from "../../type/known";
import { Argument } from "../../type/known/function";

/**
 *
 * @param context The effective PHP state machine context
 * @param node The node to examine
 */
export function checkForNode(context: Context, node: NodeTypes.Node): boolean {
    if(node.kind == "array") {
        node.items.forEach(i => context.check(i))
    } else if(node.kind == "assign") {
        context.check(node.left, true)
        context.check(node.right)
    } else if(node.kind == "bin") {
        // node.type
        context.check(node.left)
        context.check(node.right)
    } else if(node.kind == "block") {
        node.children.forEach(
            child => context.check(child)
        )
    } else if(node.kind == "boolean") {
        // node.raw
        // node.value
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
        } else {
            node.arguments.forEach((a, i) => {
                if(function_type && function_type.args[i] && function_type.args[i].byRef) {
                    context.check(a, true)
                } else {
                    context.check(a)
                }
            })
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
    } else if(node.kind == "classconstant") {
        // node.isStatic
        // node.name
        if(node.value) {
            context.check(node.value)
        }
        // node.visibility
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
    } else if(node.kind == "constref") {
        // node.name
    } else if(node.kind == "echo") {
        node.arguments.forEach(
            n => context.check(n)
        )
        // node.shortForm
    } else if(node.kind == "entry") {
        if(node.key) {
            context.check(node.key)
        }
        context.check(node.value)
    } else if(node.kind == "foreach") {
        context.check(node.body)
        if(node.key) {
            context.check(node.key, true)
        }
        // node.shortForm
        context.check(node.source)
        context.check(node.value, true)
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
    } else if(node.kind == "identifier") {
        // node.name
        // node.resolution
    } else if(node.kind == "if") {
        if(node.alternate) {
            context.check(node.alternate)
        }
        context.check(node.body)
        context.check(node.test)
        // node.shortForm
    } else if(node.kind == "include") {
        // node.once
        // node.require
        context.check(node.target)
    } else if(node.kind == "isset") {
        node.arguments.forEach(
            n => context.check(n)
        )
    } else if(node.kind == "method") {
        const inner_context = new Context()
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
        // node.isStatic
        // node.visibility
        if(!node.name.match(/^[a-z]+([A-Z0-9][a-z0-9]*)*$/)) {
            throw new Error("PSR1 4.3: method names must be in camel case (lower)")
        }
    } else if(node.kind == "namespace") {
        // node.name
        // node.withBrackets
    } else if(node.kind == "new") {
        context.check(node.what)
        node.arguments.forEach(
            a => context.check(a)
        )
    } else if(node.kind == "number") {
        // node.raw
        // node.value
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
    } else if(node.kind == "parenthesis") {
        context.check(node.inner)
    } else if(node.kind == "program") {
        node.children.forEach(
            child => context.check(child)
        )
    } else if(node.kind == "property") {
        // node.isFinal
        // node.isStatic
        // node.name
        if(node.value) {
            context.check(node.value)
        }
        // node.visibility
    } else if(node.kind == "propertylookup") {
        context.check(node.what)
        context.check(node.offset)
    } else if(node.kind == "return") {
        // node.raw
        // node.value
    } else if(node.kind == "staticlookup") {
        context.check(node.what)
        context.check(node.offset)
    } else if(node.kind == "string") {
        // node.raw
        // node.value
    } else if(node.kind == "traituse") {
        if(node.adaptations) {
            node.adaptations.forEach(
                a => context.check(a)
            )
        }
        node.traits.forEach(
            t => context.check(t)
        )
    } else if(node.kind == "unary") {
        // node.type
        context.check(node.what)
    } else if(node.kind == "variable") {
        let name: string | null
        if(typeof node.name == "string") {
            name = "$" + node.name
        } else {
            name = null
        }
        // this.node.curly
        if(name) {
            if(context.assigning) {
                context.set(name, new Known.Base())
            } else {
                if(node.byref && !context.has(name)) {
                    context.set(name, new Known.Base())
                }
                context.assert(
                    context.has(name),
                    `Unassigned variable ${name}`
                )
            }
        }
    }
    return true
}
