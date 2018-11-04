import { NodeTypes } from "../ast";
import { Context } from "../../context"
import * as Inferred from "../../type/inferred";
import * as Known from "../../type/known";
import * as Type from "../../type"
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
export function checkForNode(context: Context, node: NodeTypes.Node): Array<Type.Base> {
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
        const types = context.check(node.right)
        context.check(node.left, types[0] || new Inferred.Mixed())
        return types
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
                    context.assert(
                        node,
                        node.arguments.length >= +i + 1, // TODO not clear why this is a string
                        "Not enough arguments for call"
                    )
                }
            }
            for(const [i, a] of Object.entries(node.arguments)) {
                if(function_type.args[+i]) {
                    let arg_possibilities: Type.Base[]
                    const expected_type = function_type.args[+i].type
                    if(function_type.args[+i].byRef) {
                        arg_possibilities = context.check(a, expected_type || new Inferred.Mixed())
                    } else {
                        arg_possibilities = context.check(a)
                    }
                    if(expected_type) {
                        const type = expected_type
                        context.assert(
                            a,
                            arg_possibilities.every(arg => arg.matches(type)),
                            `Wrong type for argument ${i}: ${arg_possibilities.map(arg => arg.shortType).join(", ")} should be ${type.shortType}`
                        )
                    }
                } else {
                    context.check(a)
                }
            }
            if(function_type.returnType) {
                return [function_type.returnType]
            } else {
                return []
            }
        } else {
            node.arguments.forEach((a, i) => {
                context.check(a)
            })
            return [new Inferred.Mixed()]
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
        context.assert(
            node,
            node.name.length > 1,
            "Single-character class names are too likely to conflict"
        )
        context.assert(
            node,
            !!node.name.match(/^([A-Z0-9][a-z0-9]*)+$/),
            "PSR1 3: class names must be in camel case"
        )
        const class_structure = new Known.Class(node.name)
        context.set(node.name, class_structure)
        return [class_structure]
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
            inner_context.check(u, context.check(u)[0] || new Inferred.Mixed())
        })
        inner_context.check(node.body)
        return [
            new Known.Function(
                node.arguments.map(a => new Argument(
                    new Inferred.Mixed(),
                    a.byref,
                    !!a.value
                )),
                // FIXME return
            )
        ]
    } else if(node.kind == "constref") {
        return []
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
            context.check(node.key, new Known.String())
        }
        context.check(node.value, new Inferred.Mixed())

        context.check(node.body)
        // node.shortForm
        context.check(node.source)
        return []
    } else if(node.kind == "function") {
        const inner_context = new Context()
        const args: Argument[] = []
        node.arguments.forEach(
            a => args.push(new Argument(
                inner_context.check(a)[0], // FIXME
                a.byref,
                !!a.value,
            )) // FIXME
        )
        inner_context.returnType = node.type ?
            context.namedType(node.type.name, node.type.resolution) :
            null
        if(node.body) {
            inner_context.check(node.body)
        }
        context.set(node.name, new Known.Function(
            args,
            inner_context.returnType,
        ))
        // node.byref
        // node.nullable
        return []
    } else if(node.kind == "identifier") {
        /**
         * This represents a _name_ which may be aliased or use an implicit
         * namespace. It doesn't have an actual type.
         */
        // node.name
        // node.resolution
        return []
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
            inner_context.set("$this", new Inferred.Mixed()) // FIXME
        }
        const args: Argument[] = []
        node.arguments.forEach(
            a => args.push(new Argument(
                inner_context.check(a)[0], // FIXME
                a.byref,
                !!a.value,
            )) // FIXME
        )
        if(node.body) {
            inner_context.check(node.body)
        }
        // node.byref
        // node.nullable
        // node.isAbstract
        // node.isFinal
        // node.visibility
        context.assert(
            node,
            !!node.name.match(/^[a-z]+([A-Z0-9][a-z0-9]*)*$/),
            "PSR1 4.3: method names must be in camel case (lower)"
        )
        return []
    } else if(node.kind == "namespace") {
        // node.name
        // node.withBrackets
        return []
    } else if(node.kind == "new") {
        const types = context.check(node.what)
        node.arguments.forEach(
            a => context.check(a)
        )
        const out: Array<Known.ClassInstance> = []
        for(const t of types) {
            if(t instanceof Known.Class) {
                out.push(new Known.ClassInstance(t.ref))
            }
        }
        return out
    } else if(node.kind == "number") {
        // node.raw
        // node.value
        if(Math.floor(node.value) == node.value) {
            return [new Known.Int(node.value)]
        } else {
            return [new Known.Float(node.value)]
        }
    } else if(node.kind == "offsetlookup") {
        context.check(node.what)
        context.check(node.offset)
        return [
            new Inferred.Mixed()
        ] // FIXME
    } else if(node.kind == "parameter") {
        // node.byref
        // node.nullable

        let type: Type.Base
        if(node.type) {
            context.check(node.type)
            // Identifiers don't have a type, but now that we're here we know
            // that there is one.
            type = context.namedType(node.type.name, node.type.resolution)
        } else {
            type = new Inferred.Mixed()
        }
        if(node.value) {
            context.check(node.value)
        }
        // node.variadic
        context.set("$" + node.name, type)
        return [type]
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
            new Inferred.Mixed()
        ] // FIXME
    } else if(node.kind == "retif") {
        const test = context.check(node.test)
        const true_branch = node.trueExpr ? context.check(node.trueExpr) : test
        return true_branch.concat(context.check(node.falseExpr))
    } else if(node.kind == "return") {
        const types = node.expr ? context.check(node.expr) : []
        const expected_type = context.returnType
        if(expected_type) {
            context.assert(
                node,
                types.every(t => t.matches(expected_type)),
                `Wrong type for return: ${types.map(t => t.shortType).join(", ")} should be ${expected_type.shortType}`
            )
        }
        return types
    } else if(node.kind == "staticlookup") {
        context.check(node.what)
        context.check(node.offset)
        return [
            new Inferred.Mixed()
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
            new Inferred.Mixed()
        ] // FIXME
    } else if(node.kind == "variable") {
        // this.node.curly
        if(typeof node.name == "string") {
            const name = "$" + node.name
            if(context.assigning) {
                context.set(name, context.assigning)
            } else {
                if(node.byref && !context.has(name)) {
                    context.set(name, new Inferred.Mixed())
                }
                context.assert(
                    node,
                    context.has(name),
                    `Unassigned variable ${name}`
                )
            }
        }
        return [new Inferred.Mixed()] // FIXME
    }
    throw new Error(`Unknown type: ${node.kind}`)
}
