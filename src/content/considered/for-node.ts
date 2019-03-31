import { NodeTypes } from "../ast";
import { Context } from "../../context"
import * as Type from "../../type"
import { Argument } from "../../type/function";

const debug = require("debug")("php-lint:context")

/**
 *
 * @param context The effective PHP state machine context
 * @param node The node to examine
 * @returns A single expression type. If an unknown thing would be returned,
 * this should be just Type.Base; if no thing would be returned, this should be
 * Type.Void. Anything which cannot be to the right of "=" should be
 * Type.Void.
 */
export function checkForNode(context: Context, node: NodeTypes.Node): Type.Base {
    if(node.kind == "array") {
        let out: Type.BaseArray = new Type.IndexedArray()
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
        context.check(node.left, type || new Type.Mixed())
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
                return new Type.Bool()
            case "<=>":
                return (new Type.Int(-1)).combinedWith(
                    new Type.Int(0)
                ).combinedWith(
                    new Type.Int(1)
                )
            case "%":
            case "&":
            case "<<":
            case ">>":
            case "^":
            case "|":
                return new Type.Int()
            case "*":
            case "**":
            case "+":
            case "-":
            case "/":
                // TODO recognise float promotion
                return new Type.Float()
            case ".":
                return new Type.String()
            case "??":
                return rtype
        }
    } else if(node.kind == "block") {
        node.children.forEach(
            child => context.check(child)
        )
        return new Type.Void()
    } else if(node.kind == "boolean") {
        return new Type.Bool(node.value)
    } else if(node.kind == "call") {
        let function_type: Type.Function | null = null
        if(node.what) {
            const what_type = context.check(node.what)
            if(node.what.kind == "identifier") {
                const type = context.get(node.what.name)
                if(type instanceof Type.Function) {
                    function_type = type
                } else {
                    debug("type miss!")
                }
            } else if(node.what.kind == "propertylookup") {
                if(what_type instanceof Type.Function) {
                    debug("PL hit")
                    function_type = what_type
                } else {
                    debug("PL MISS")
                    debug(what_type)
                }
            } else {
                debug("Node miss")
                debug(node)
            }
        } else {
            debug("What miss")
        }
        if(function_type) {
            debug("Function type go")
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
                        arg_possibility = context.check(a, expected_type || new Type.Mixed())
                    } else {
                        arg_possibility = context.check(a)
                    }
                    if(expected_type) {
                        const type = expected_type
                        debug(arg_possibility, type)
                        context.assert(
                            a,
                            arg_possibility.matches(type),
                            `Wrong type for argument ${i}: ${arg_possibility} should be ${type}`
                        )
                    }
                } else {
                    context.check(a)
                }
            }
            debug(function_type.returnType)
            if(function_type.returnType) {
                return function_type.returnType
            } else {
                return new Type.Void()
            }
        } else {
            debug("Function type no")
            node.arguments.forEach((a, i) => {
                context.check(a)
            })
            return new Type.Mixed()
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
        const class_structure = new Type.Class(context.qualifyName(node.name, "qn"))
        context.setConstant(node.name, class_structure)
        return class_structure
    } else if(node.kind == "classconstant") {
        // node.isStatic
        // node.name
        if(node.value) {
            context.check(node.value)
        }
        // node.visibility
        return new Type.Void()
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
        return new Type.Function(
            node.arguments.map(a => new Argument(
                new Type.Mixed(),
                a.byref,
                !!a.value
            )),
            // FIXME return
        )
    } else if(node.kind == "constref") {
        // Stuff like method names
        return new Type.String(node.name)
    } else if(node.kind == "echo") {
        node.arguments.forEach(
            n => context.check(n)
        )
        // node.shortForm
        return new Type.Void()
    } else if(node.kind == "entry") {
        if(node.key) {
            context.check(node.key)
        }
        return context.check(node.value)
    } else if(node.kind == "foreach") {
        const source_type = context.check(node.source)
        if(node.key) {
            context.check(node.key, new Type.String())
        }
        if(source_type) {
            if(source_type instanceof Type.IndexedArray && source_type.memberType) {
                context.check(
                    node.value,
                    source_type.memberType
                )
            } else {
                context.check(
                    node.value,
                    new Type.Mixed()
                )
            }
        } else {
            context.check(
                node.value,
                new Type.Mixed()
            )
        }

        context.check(node.body)
        // node.shortForm
        context.check(node.source)
        return new Type.Void()
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
        context.setConstant(node.name, new Type.Function(
            args,
            inner_context.realReturnType,
        ))
        // node.byref
        // node.nullable
        return new Type.Void()
    } else if(node.kind == "identifier") {
        /**
         * This represents a _name_ which may be aliased or use an implicit
         * namespace. It doesn't have an actual type.
         */
        // node.resolution
        return new Type.Class(context.qualifyName(node.name, node.resolution))
    } else if(node.kind == "if") {
        context.check(node.test)
        const true_namespace_override: Map<string, Type.Base> = new Map()
        const false_namespace_override: Map<string, Type.Base> = new Map()
        if(node.test.kind == "variable" && typeof node.test.name == "string") {
            const v = context.get("$" + node.test.name)
            if(v instanceof Type.Optional) {
                true_namespace_override.set("$" + node.test.name, v.content)
                false_namespace_override.set("$" + node.test.name, v.falseValue)
            }
        } else if(node.test.kind == "unary" && node.test.what.kind == "variable" && typeof node.test.what.name == "string") {
            const v = context.get("$" + node.test.what.name)
            if(v instanceof Type.Optional) {
                true_namespace_override.set("$" + node.test.what.name, v.falseValue)
                false_namespace_override.set("$" + node.test.what.name, v.content)
            }
        }
        if(true_namespace_override.size) {
            const inner_context_true = new Context(context)
            for(const [name, v] of true_namespace_override.entries()) {
                inner_context_true.set(name, v)
            }
            const inner_context_false = new Context(context)
            for(const [name, v] of false_namespace_override.entries()) {
                inner_context_false.set(name, v)
            }
            inner_context_true.check(node.body)
            if(node.alternate) {
                inner_context_false.check(node.alternate)
            }
        } else {
            context.check(node.body)
            if(node.alternate) {
                context.check(node.alternate)
            }
        }
        // node.shortForm
        return new Type.Void()
    } else if(node.kind == "include") {
        // node.once
        // node.require
        context.check(node.target)
        return new Type.Bool()
    } else if(node.kind == "isset") {
        node.arguments.forEach(
            n => context.check(n)
        )
        return new Type.Bool()
    } else if(node.kind == "method") {
        const inner_context = new Context(context)
        if(!node.isStatic) {
            inner_context.set("$this", new Type.Mixed()) // FIXME
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
        return new Type.Void()
    } else if(node.kind == "namespace") {
        // node.name
        // node.withBrackets
        context.namespacePrefix = name
        return new Type.Void()
    } else if(node.kind == "new") {
        const type = context.check(node.what)
        node.arguments.forEach(
            a => context.check(a)
        )
        if(type instanceof Type.Class) {
            return new Type.ClassInstance(type.ref)
        }
        debug(type)
        return new Type.Void()
    } else if(node.kind == "number") {
        // node.raw
        // node.value
        if(Math.floor(node.value) == node.value) {
            return new Type.Int(node.value)
        } else {
            return new Type.Float(node.value)
        }
    } else if(node.kind == "offsetlookup") {
        const type = context.check(node.what)
        context.check(node.offset)
        if(type) {
            return(
                type instanceof Type.IndexedArray && type.memberType || new Type.Mixed()
            )
        } else {
            return new Type.Mixed() // FIXME
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
            type = new Type.Mixed()
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
        return new Type.Void()
    } else if(node.kind == "property") {
        // node.isFinal
        // node.isStatic
        // node.name
        if(node.value) {
            context.check(node.value)
        }
        // node.visibility
        return new Type.Void()
    } else if(node.kind == "propertylookup") {
        const what_type = context.check(node.what)
        const offset_type = context.check(node.offset)
        if(what_type instanceof Type.Class || what_type instanceof Type.ClassInstance) {
            // ...
        } else {
            // debug("Not a class")
            return new Type.Mixed()
        }
        debug("Object type hit")
        debug(what_type!.shortType, offset_type, node)
        if(offset_type instanceof Type.String) {
            if(what_type instanceof Type.ClassInstance) {
                const class_name = what_type.shortType.replace(/^\\/, "")
                const class_type = context.get(class_name)
                if(class_type instanceof Type.Class) {
                    const method_type = class_type.methods.get(offset_type.value!)
                    if(method_type) {
                        debug(`${class_name}::${offset_type.value} HIT`)
                        return method_type
                    }
                    // TODO: properties
                    debug(context)
                    debug(`${class_name}::${offset_type.value} MISS`)
                    return new Type.Mixed()
                } else {
                    throw new Error("Internal error: no class " + class_name)
                }
            } else {
                throw new Error("Bad type: " + what_type.constructor.name)
            }
        } else {
            debug("Non-string offset")
            return new Type.Mixed() // FIXME
        }
    } else if(node.kind == "retif") {
        const test = context.check(node.test)
        const true_branch = node.trueExpr ? context.check(node.trueExpr) : test
        return true_branch.combinedWith(context.check(node.falseExpr))
    } else if(node.kind == "return") {
        const type = node.expr ? context.check(node.expr) : new Type.Void()
        const expected_type = context.returnType
        if(expected_type) {
            context.assert(
                node,
                !!(type && type.matches(expected_type)),
                `Wrong type for return: ${type} should be ${expected_type}`
            )
        }
        context.realReturnType = context.realReturnType ?
            type.combinedWith(context.realReturnType) :
            type
        return type
    } else if(node.kind == "staticlookup") {
        context.check(node.what)
        context.check(node.offset)
        return new Type.Mixed() // FIXME
    } else if(node.kind == "string") {
        // node.raw
        // node.value
        return new Type.String(node.value)
    } else if(node.kind == "traituse") {
        if(node.adaptations) {
            node.adaptations.forEach(
                a => context.check(a)
            )
        }
        node.traits.forEach(
            t => context.check(t)
        )
        return new Type.Void()
    } else if(node.kind == "unary") {
        // node.type
        context.check(node.what)
        return new Type.Mixed() // FIXME
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
        return new Type.Void()
    } else if(node.kind == "useitem") {
        context.importName(node.name, node.alias)
        return new Type.Void()
    } else if(node.kind == "variable") {
        // this.node.curly
        if(typeof node.name == "string") {
            const name = "$" + node.name
            if(context.assigning) {
                context.set(name, context.assigning)
            } else {
                if(node.byref && !context.has(name)) {
                    context.set(name, new Type.Mixed())
                }
                context.assert(
                    node,
                    context.has(name),
                    `Unassigned variable ${name}`
                )
            }
            return context.get(name)!
        } else {
            return new Type.Mixed() // FIXME
        }
    }
    throw new Error(`Unknown type: ${node.kind}`)
}
