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
 * @returns A single expression type. If an unknown thing would be returned,
 * this should be just Known.Base; if no thing would be returned, this should be
 * Known.Void. Anything which cannot be to the right of "=" should be
 * Known.Void.
 */
export function checkForNode(context: Context, node: NodeTypes.Node): Type.Base {
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
        return out
    } else if(node.kind == "assign") {
        const type = context.check(node.right)
        context.check(node.left, type || new Inferred.Mixed())
        return type
    } else if(node.kind == "bin") {
        // node.type
        context.check(node.left)
        const rtype = context.check(node.right)
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
                return new Known.Bool()
            case "<=>":
                return Context.combineTypes([
                    new Known.Int(-1),
                    new Known.Int(0),
                    new Known.Int(1)
                ])
            case "%":
            case "&":
            case "<<":
            case ">>":
            case "^":
            case "|":
                return new Known.Int()
            case "*":
            case "**":
            case "+":
            case "-":
            case "/":
                // TODO recognise float promotion
                return new Known.Float()
            case ".":
                return new Known.String()
            case "??":
                return rtype
        }
    } else if(node.kind == "block") {
        node.children.forEach(
            child => context.check(child)
        )
        return new Known.Void()
    } else if(node.kind == "boolean") {
        return new Known.Bool(node.value)
    } else if(node.kind == "call") {
        let function_type: Known.Function | null = null
        if(node.what) {
            const what_type = context.check(node.what)
            if(node.what.kind == "identifier") {
                const type = context.get(node.what.name)
                if(type instanceof Known.Function) {
                    function_type = type
                }
            } else if(node.what.kind == "propertylookup") {
                if(what_type instanceof Known.Function) {
                    function_type = what_type
                } else {
                    console.log(node.what)
                }
            } else {
                console.log(node)
            }
        }
        if(function_type) {
            for(const [i, a] of Object.entries(function_type.args)) {
                if(!a.hasDefaultValue) {
                    context.assert(
                        node,
                        node.arguments.length >= +i + 1, // (Object.entries emits string keys)
                        `Not enough arguments for call: ${node.arguments.length} < ${+i + 1}`
                    )
                }
            }
            for(const [i, a] of Object.entries(node.arguments)) {
                if(function_type.args[+i]) {
                    let arg_possibility: Type.Base | null
                    const expected_type = function_type.args[+i].type
                    if(function_type.args[+i].byRef) {
                        arg_possibility = context.check(a, expected_type || new Inferred.Mixed())
                    } else {
                        arg_possibility = context.check(a)
                    }
                    if(expected_type) {
                        const type = expected_type
                        console.log(arg_possibility, type)
                        context.assert(
                            a,
                            arg_possibility.matches(type),
                            `Wrong type for argument ${i}: ${arg_possibility.shortType} should be ${type.shortType}`
                        )
                    }
                } else {
                    context.check(a)
                }
            }
            if(function_type.returnType) {
                return function_type.returnType
            } else {
                return new Known.Void()
            }
        } else {
            node.arguments.forEach((a, i) => {
                context.check(a)
            })
            return new Inferred.Mixed()
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
        const class_structure = new Known.Class(context.qualifyName(node.name, "qn"))
        context.setConstant(node.name, class_structure)
        return class_structure
    } else if(node.kind == "classconstant") {
        // node.isStatic
        // node.name
        if(node.value) {
            context.check(node.value)
        }
        // node.visibility
        return new Known.Void()
    } else if(node.kind == "closure") {
        const inner_context = new Context(context)
        node.arguments.forEach(
            a => inner_context.check(a)
        )
        // node.byref
        // node.isStatic
        // node.nullable
        node.uses.forEach(u => {
            inner_context.check(u, context.check(u))
        })
        inner_context.check(node.body)
        return new Known.Function(
            node.arguments.map(a => new Argument(
                new Inferred.Mixed(),
                a.byref,
                !!a.value
            )),
            // FIXME return
        )
    } else if(node.kind == "constref") {
        // Stuff like method names
        return new Known.String(node.name)
    } else if(node.kind == "echo") {
        node.arguments.forEach(
            n => context.check(n)
        )
        // node.shortForm
        return new Known.Void()
    } else if(node.kind == "entry") {
        if(node.key) {
            context.check(node.key)
        }
        return context.check(node.value)
    } else if(node.kind == "foreach") {
        const source_type = context.check(node.source)
        if(node.key) {
            context.check(node.key, new Known.String())
        }
        if(source_type) {
            if(source_type instanceof Known.IndexedArray && source_type.memberType) {
                context.check(
                    node.value,
                    source_type.memberType
                )
            } else {
                context.check(
                    node.value,
                    new Inferred.Mixed()
                )
            }
        } else {
            context.check(
                node.value,
                new Inferred.Mixed()
            )
        }

        context.check(node.body)
        // node.shortForm
        context.check(node.source)
        return new Known.Void()
    } else if(node.kind == "function") {
        const inner_context = new Context(context)
        const args: Argument[] = []
        node.arguments.forEach(
            a => args.push(new Argument(
                inner_context.check(a), // FIXME
                a.byref,
                !!a.value,
            )) // FIXME
        )
        inner_context.returnType = node.type ?
            context.namedType(node.type.name, node.type.resolution) :
            null
        inner_context.realReturnType = null
        if(node.body) {
            inner_context.check(node.body)
        }
        context.setConstant(node.name, new Known.Function(
            args,
            inner_context.realReturnType,
        ))
        // node.byref
        // node.nullable
        return new Known.Void()
    } else if(node.kind == "identifier") {
        /**
         * This represents a _name_ which may be aliased or use an implicit
         * namespace. It doesn't have an actual type.
         */
        // node.resolution
        return new Known.Class(context.qualifyName(node.name, node.resolution))
    } else if(node.kind == "if") {
        if(node.alternate) {
            context.check(node.alternate)
        }
        context.check(node.body)
        context.check(node.test)
        // node.shortForm
        return new Known.Void()
    } else if(node.kind == "include") {
        // node.once
        // node.require
        context.check(node.target)
        return new Known.Bool()
    } else if(node.kind == "isset") {
        node.arguments.forEach(
            n => context.check(n)
        )
        return new Known.Bool()
    } else if(node.kind == "method") {
        const inner_context = new Context(context)
        if(!node.isStatic) {
            inner_context.set("$this", new Inferred.Mixed()) // FIXME
        }
        const args: Argument[] = []
        node.arguments.forEach(
            a => args.push(new Argument(
                inner_context.check(a), // FIXME
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
        return new Known.Void()
    } else if(node.kind == "namespace") {
        // node.name
        // node.withBrackets
        context.namespacePrefix = name
        return new Known.Void()
    } else if(node.kind == "new") {
        const type = context.check(node.what)
        node.arguments.forEach(
            a => context.check(a)
        )
        if(type instanceof Known.Class) {
            return new Known.ClassInstance(type.ref)
        }
        console.log(type)
        return new Known.Void()
    } else if(node.kind == "number") {
        // node.raw
        // node.value
        if(Math.floor(node.value) == node.value) {
            return new Known.Int(node.value)
        } else {
            return new Known.Float(node.value)
        }
    } else if(node.kind == "offsetlookup") {
        const type = context.check(node.what)
        context.check(node.offset)
        if(type) {
            return(
                type instanceof Known.IndexedArray && type.memberType || new Inferred.Mixed()
            )
        } else {
            return new Inferred.Mixed() // FIXME
        }
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
        return type
    } else if(node.kind == "parenthesis") {
        return context.check(node.inner)
    } else if(node.kind == "program") {
        node.children.forEach(
            child => context.check(child)
        )
        return new Known.Void()
    } else if(node.kind == "property") {
        // node.isFinal
        // node.isStatic
        // node.name
        if(node.value) {
            context.check(node.value)
        }
        // node.visibility
        return new Known.Void()
    } else if(node.kind == "propertylookup") {
        const what_type = context.check(node.what)
        const offset_type = context.check(node.offset)
        if(what_type instanceof Known.Class || what_type instanceof Known.ClassInstance) {
            // ...
        } else {
            // console.log("Not a class")
            return new Inferred.Mixed()
        }
        console.log(what_type!.shortType, offset_type, node)
        return new Inferred.Mixed() // FIXME
    } else if(node.kind == "retif") {
        const test = context.check(node.test)
        const true_branch = node.trueExpr ? context.check(node.trueExpr) : test
        return Context.combineTypes([
            true_branch,
            context.check(node.falseExpr)
        ])
    } else if(node.kind == "return") {
        const type = node.expr ? context.check(node.expr) : new Known.Void()
        const expected_type = context.returnType
        if(expected_type) {
            context.assert(
                node,
                !!(type && type.matches(expected_type)),
                `Wrong type for return: ${type!.shortType} should be ${expected_type.shortType}`
            )
        }
        context.realReturnType = Context.combineTypes([type, context.realReturnType])
        return type
    } else if(node.kind == "staticlookup") {
        context.check(node.what)
        context.check(node.offset)
        return new Inferred.Mixed() // FIXME
    } else if(node.kind == "string") {
        // node.raw
        // node.value
        return new Known.String(node.raw)
    } else if(node.kind == "traituse") {
        if(node.adaptations) {
            node.adaptations.forEach(
                a => context.check(a)
            )
        }
        node.traits.forEach(
            t => context.check(t)
        )
        return new Known.Void()
    } else if(node.kind == "unary") {
        // node.type
        context.check(node.what)
        return new Inferred.Mixed() // FIXME
    } else if(node.kind == "usegroup") {
        // type
        if(node.name) {
            for(const u of node.item) {
                context.importName(node.name + u.name, u.alias)
            }
        } else {
            for(const u of node.item) {
                context.importName(u.name, u.alias)
            }
        }
        return new Known.Void()
    } else if(node.kind == "useitem") {
        context.importName(node.name, node.alias)
        return new Known.Void()
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
            return context.get(name)!
        } else {
            return new Inferred.Mixed() // FIXME
        }
    }
    throw new Error(`Unknown type: ${node.kind}`)
}
