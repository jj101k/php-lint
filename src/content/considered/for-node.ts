import { NodeTypes } from "../ast";
import { Context } from "../../context"
import * as Type from "../../type"
import { Argument } from "../../type/function";
import { LintError } from "../../lint-error";

const debug = require("debug")("php-lint:context")

/**
 * True to support the pattern $a->b()->c()->d() where each method returns $this
 * OR some false value.
 */
const FLUENT_ASSERT_CHAIN = true

/**
 * True to allow echo of false for the common case where that echoes nothing.
 */
const OPTIONAL_ECHO = true

/**
 * True to consider the mixed type to not match any other type.
 */
const STRICT_MIXED = false

/**
 *
 * @param node The node to examine
 * @param context The effective PHP state machine context
 * @returns A single expression type. If an unknown thing would be returned,
 * this should be just Type.Base; if no thing would be returned, this should be
 * Type.Void. Anything which cannot be to the right of "=" should be
 * Type.Void.
 */
type Handler = (node: any, context: Context) => Type.Base

export const Handlers: {[kind: string]: Handler} = {
    array(node: NodeTypes.Array, context: Context) {
        let out: Type.BaseArray = new Type.IndexedArray()
        for(const i of node.items) {
            let key = null
            if(i.kind == "entry" && i.key) {
                key = Handlers[i.key.kind](i.key, context)
            }
            const v = Handlers[i.kind](i, context)
            out = out.set(key, v)
        }
        return out
    },
    assign(node: NodeTypes.Assign, context: Context) {
        const type = Handlers[node.right.kind](node.right, context)
        context.assign(type || new Type.Mixed(), node.left)
        return type
    },
    bin(node: NodeTypes.Bin, context: Context) {
        // node.type
        const type = Handlers[node.left.kind](node.left, context)
        const rtype = Handlers[node.right.kind](node.right, context)
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
            case "or":
            case "xor":
            case "||":
                return new Type.Bool()
            case "instanceof":
                if(rtype instanceof Type.String && rtype.value) {
                    const c = context.get(rtype.value)
                    if(
                        c instanceof Type.Class &&
                        type instanceof Type.ClassInstance &&
                        c.matches(type)
                    ) {
                        return new Type.Bool(true)
                    } else if(c && type.matches(c)) {
                        return new Type.Bool()
                    } else {
                        return new Type.Bool(false)
                    }
                } else {
                    return new Type.Bool()
                }
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
    },
    block(node: NodeTypes.Block, context: Context) {
        for(const child of node.children) {
            Handlers[child.kind](child, context)
        }
        return new Type.Void()
    },
    boolean(node: NodeTypes.Boolean) {
        return new Type.Bool(node.value)
    },
    break(node: NodeTypes.Break) {
        // node.level
        return new Type.Void()
    },
    call(node: NodeTypes.Call, context: Context) {
        let function_type: Type.Function | null = null
        if(node.what) {
            const what_type = context.noAssign(node.what)
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
                    debug(node.what)
                    debug(what_type)
                }
            } else if(node.what.kind == "staticlookup") {
                if(what_type instanceof Type.Function) {
                    debug("SL hit")
                    function_type = what_type
                } else {
                    debug("SL MISS")
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
                        arg_possibility = context.assign(
                            expected_type || new Type.Mixed(),
                            a
                        )!
                    } else {
                        arg_possibility = Handlers[a.kind](a, context)
                    }
                    if(expected_type) {
                        const type = expected_type
                        debug(arg_possibility, type)
                        if(STRICT_MIXED) {
                            context.assert(
                                a,
                                arg_possibility.matches(type),
                                `Wrong type for argument ${i}: ${arg_possibility} should be ${type}`
                            )
                        } else {
                            context.assert(
                                a,
                                arg_possibility.mayMatch(type),
                                `Invalid type for argument ${i}: ${arg_possibility} should be ${type}`
                            )
                        }
                    }
                } else {
                    Handlers[a.kind](a, context)
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
            for(const a of node.arguments) {
                Handlers[a.kind](a, context)
            }
            return new Type.Mixed()
        }
    },
    case(node: NodeTypes.Case, context: Context) {
        if(node.test) {
            Handlers[node.test.kind](node.test, context)
        }
        if(node.body) {
            Handlers[node.body.kind](node.body, context)
        }
        return new Type.Void()
    },
    cast(node: NodeTypes.Cast, context: Context) {
        // node.type
        // node.raw
        Handlers[node.what.kind](node.what, context)
        return context.namedType(node.type, "fqn")
    },
    catch(node: NodeTypes.Catch, context: Context) {
        for(const w of node.what) {
            Handlers[w.kind](w, context)
        }
        Handlers[node.variable.kind](node.variable, context)
        Handlers[node.body.kind](node.body, context)
        return new Type.Void()
    },
    class(node: NodeTypes.Class, context: Context) {
        const qname = context.qualifyName(node.name, "qn")
        const class_structure = new Type.Class(qname)
        for(const b of node.body) {
            if(b.kind == "method") {
                const t = Handlers[b.kind](b, context)
                if(t instanceof Type.Function) {
                    debug(`Attaching function ${b.name} to ${qname}`)
                    if(b.isStatic) {
                        class_structure.classMethods.set(b.name, t)
                    } else {
                        class_structure.methods.set(b.name, t)
                    }
                } else {
                    debug("Method type miss")
                    debug(t)
                }
            } else {
                Handlers[b.kind](b, context)
            }
        }
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
        context.setConstant(qname.replace(/^\\/, ""), class_structure)
        debug(`Setting ${qname} as a class`)
        return class_structure
    },
    classconstant(node: NodeTypes.ClassConstant, context: Context) {
        // node.isStatic
        // node.name
        if(node.value) {
            Handlers[node.value.kind](node.value, context)
        }
        // node.visibility
        return new Type.Void()
    },
    closure(node: NodeTypes.Closure, context: Context) {
        const inner_context = new Context(context)
        for(const a of node.arguments) {
            Handlers[a.kind](a, inner_context)
        }
        // node.byref
        // node.isStatic
        // node.nullable
        for(const u of node.uses) {
            inner_context.assign(Handlers[u.kind](u, context), u)
        }
        Handlers[node.body.kind](node.body, inner_context)
        return new Type.Function(
            node.arguments.map(a => new Argument(
                new Type.Mixed(),
                a.byref,
                !!a.value
            )),
            // FIXME return
        )
    },
    constref(node: NodeTypes.ConstRef, context: Context) {
        // Stuff like method names
        if(typeof node.name == "string") {
            return new Type.String(node.name)
        } else {
            return new Type.String(
                context.qualifyName(node.name.name, node.name.resolution)
            )
        }
    },
    continue(node: NodeTypes.Continue) {
        // node.level
        return new Type.Void()
    },
    declare(node: NodeTypes.Declare, context: Context) {
        // node.mode
        // node.what
        for(const c of node.children) {
            Handlers[c.kind](c, context)
        }
        return new Type.Void()
    },
    do(node: NodeTypes.Do, context: Context) {
        Handlers[node.test.kind](node.test, context)
        Handlers[node.body.kind](node.body, context)
        return new Type.Void()
    },
    echo(node: NodeTypes.Echo, context: Context) {
        const expectedType = OPTIONAL_ECHO ?
            new Type.OptionalFalse(new Type.String()) :
            new Type.String()
        for(const n of node.arguments) {
            const type = Handlers[n.kind](n, context)
            context.assert(
                node,
                type.matches(expectedType),
                `Echo arguments: ${type} does not match ${expectedType}`
            )
        }
        // node.shortForm
        return new Type.Void()
    },
    empty(node: NodeTypes.Empty, context: Context) {
        for(const n of node.arguments) {
            try {
                Handlers[n.kind](n, context)
            } catch(e) {
                //
            }
        }
        return new Type.Bool()
    },
    encapsed(node: NodeTypes.Encapsed) {
        // node.type
        // node.label
        return new Type.String(node.value)
    },
    entry(node: NodeTypes.Entry, context: Context) {
        if(node.key) {
            Handlers[node.key.kind](node.key, context)
        }
        return Handlers[node.value.kind](node.value, context)
    },
    for(node: NodeTypes.For, context: Context) {
        for(const i of node.init) {
            Handlers[i.kind](i, context)
        }
        for(const t of node.test) {
            Handlers[t.kind](t, context)
        }
        for(const c of node.increment) {
            Handlers[c.kind](c, context)
        }
        Handlers[node.body.kind](node.body, context)
        return new Type.Void()
    },
    foreach(node: NodeTypes.Foreach, context: Context) {
        const source_type = Handlers[node.source.kind](node.source, context)
        let assign_type: Type.Base
        if(node.key) {
            assign_type = new Type.String()
        } else if(source_type && source_type instanceof Type.IndexedArray && source_type.memberType) {
            assign_type = source_type.memberType
        } else {
            assign_type = new Type.Mixed()
        }
        context.assign(assign_type, node.value)

        Handlers[node.body.kind](node.body, context)
        // node.shortForm
        Handlers[node.source.kind](node.source, context)
        return new Type.Void()
    },
    function(node: NodeTypes.Function, context: Context) {
        const inner_context = new Context(context)
        const args: Argument[] = []
        for(const a of node.arguments) {
            args.push(new Argument(
                Handlers[a.kind](a, inner_context), // FIXME
                a.byref,
                !!a.value,
            )) // FIXME
        }
        inner_context.returnType = node.type ?
            context.namedType(node.type.name, node.type.resolution) :
            null
        inner_context.realReturnType = null
        if(node.body) {
            Handlers[node.body.kind](node.body, inner_context)
        }
        context.setConstant(node.name, new Type.Function(
            args,
            inner_context.realReturnType,
        ))
        // node.byref
        // node.nullable
        return new Type.Void()
    },
    identifier(node: NodeTypes.Identifier, context: Context) {
        /**
         * This represents a _name_ which may be aliased or use an implicit
         * namespace. It doesn't have an actual type.
         */
        // node.resolution
        const v = context.get(
            context.qualifyName(node.name, node.resolution).replace(/^\\/, "")
        )
        if(v) {
            return v
        } else {
            return context.namedType(node.name, node.resolution)
        }
    },
    if(node: NodeTypes.If, context: Context) {
        const check_value = Handlers[node.test.kind](node.test, context)
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
        let inner_context_true: Context
        let inner_context_false: Context
        if(true_namespace_override.size) {
            inner_context_true = new Context(context)
            for(const [name, v] of true_namespace_override.entries()) {
                inner_context_true.set(name, v)
            }
            inner_context_false = new Context(context)
            for(const [name, v] of false_namespace_override.entries()) {
                inner_context_false.set(name, v)
            }
        } else {
            inner_context_true = context
            inner_context_false = context
        }
        if(check_value.asBoolean === false) {
            debug("Skipping impossible if branch")
        } else {
            Handlers[node.body.kind](node.body, inner_context_true)
        }
        if(node.alternate) {
            if(check_value.asBoolean === true) {
                debug("Skipping impossible else branch")
            } else {
                Handlers[node.alternate.kind](node.alternate, inner_context_false)
            }
        }
        // node.shortForm
        return new Type.Void()
    },
    include(node: NodeTypes.Include, context: Context) {
        // node.once
        // node.require
        const v = Handlers[node.target.kind](node.target, context)
        if(v instanceof Type.String && v.value) {
            debug(`Include for ${v.value}`)
            if(node.require) {
                context.checkFile(v.value)
                return new Type.Bool(true)
            } else {
                try {
                    context.checkFile(v.value)
                    return new Type.Bool(true)
                } catch(e) {
                    debug(e)
                    return new Type.Bool(false)
                }
            }
        } else {
            debug(`Include (unknown)`)
            return new Type.Bool()
        }
    },
    inline(node: NodeTypes.Inline) {
        // node.raw
        // node.value
        return new Type.String(node.value)
    },
    interface(node: NodeTypes.Interface, context: Context) {
        const qname = context.qualifyName(node.name, "qn")
        const interface_structure = new Type.Class(qname)
        for(const b of node.body) {
            if(b.kind == "method") {
                const t = Handlers[b.kind](b, context)
                if(t instanceof Type.Function) {
                    debug(`Attaching function ${b.name} to ${qname}`)
                    if(b.isStatic) {
                        interface_structure.classMethods.set(b.name, t)
                    } else {
                        interface_structure.methods.set(b.name, t)
                    }
                } else {
                    debug("Method type miss")
                    debug(t)
                }
            } else {
                Handlers[b.kind](b, context)
            }
        }
        // node.extends
        // node.implements
        // node.isAbstract
        // node.isAnonymous
        // node.isFinal
        context.assert(
            node,
            node.name.length > 1,
            "Single-character interface names are too likely to conflict"
        )
        context.assert(
            node,
            !!node.name.match(/^([A-Z0-9][a-z0-9]*)+$/),
            "PSR1 3: interface names must be in camel case"
        )
        context.setConstant(qname.replace(/^\\/, ""), interface_structure)
        debug(`Setting ${qname} as an interface`)
        return interface_structure
    },
    isset(node: NodeTypes.Isset, context: Context) {
        for(const n of node.arguments) {
            try {
                Handlers[n.kind](n, context)
            } catch(e) {
                return new Type.Bool(false)
            }
        }
        return new Type.Bool()
    },
    list(node: NodeTypes.List, context: Context) {
        for(const n of node.arguments) {
            try {
                Handlers[n.kind](n, context)
            } catch(e) {
                //
            }
        }
        return new Type.IndexedArray()
    },
    magic(node: NodeTypes.Magic) {
        return new Type.Mixed()
    },
    method(node: NodeTypes.Method, context: Context) {
        const inner_context = new Context(context)
        if(!node.isStatic) {
            inner_context.set("$this", new Type.Mixed()) // FIXME
        }
        const args: Argument[] = []
        for(const a of node.arguments) {
            args.push(new Argument(
                Handlers[a.kind](a, inner_context), // FIXME
                a.byref,
                !!a.value,
            )) // FIXME
        }
        if(node.body) {
            Handlers[node.body.kind](node.body, inner_context)
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
        const returnType = node.type ?
            Handlers[node.type.kind](node.type, context) :
            new Type.Mixed()
        return new Type.Function(
            args,
            returnType
        )
    },
    namespace(node: NodeTypes.Namespace, context: Context) {
        // node.withBrackets
        context.namespacePrefix = node.name
        for(const c of node.children) {
            Handlers[c.kind](c, context)
        }
        return new Type.Void()
    },
    new(node: NodeTypes.New, context: Context) {
        const type = Handlers[node.what.kind](node.what, context)
        for(const a of node.arguments) {
            Handlers[a.kind](a, context)
        }
        if(type instanceof Type.Class) {
            return new Type.ClassInstance(type.ref)
        }
        debug(type)
        return new Type.Void()
    },
    number(node: NodeTypes.Number) {
        // node.raw
        // node.value
        if(Math.floor(node.value) == node.value) {
            return new Type.Int(node.value)
        } else {
            return new Type.Float(node.value)
        }
    },
    offsetlookup(node: NodeTypes.OffsetLookup, context: Context) {
        const type = Handlers[node.what.kind](node.what, context)
        if(node.offset) {
            // This is unset for `$foo[] = 1;`
            Handlers[node.offset.kind](node.offset, context)
        }
        if(type) {
            return(
                type instanceof Type.IndexedArray && type.memberType || new Type.Mixed()
            )
        } else {
            return new Type.Mixed() // FIXME
        }
    },
    parameter(node: NodeTypes.Parameter, context: Context) {
        // node.byref
        // node.nullable

        let type: Type.Base
        if(node.type) {
            Handlers[node.type.kind](node.type, context)
            // Identifiers don't have a type, but now that we're here we know
            // that there is one.
            type = context.namedType(node.type.name, node.type.resolution)
        } else {
            type = new Type.Mixed()
        }
        if(node.value) {
            Handlers[node.value.kind](node.value, context)
        }
        // node.variadic
        context.set("$" + node.name, type)
        return type
    },
    parenthesis(node: NodeTypes.Parenthesis, context: Context) {
        return Handlers[node.inner.kind](node.inner, context)
    },
    post(node: NodeTypes.Post, context: Context) {
        // node.type
        const type = Handlers[node.what.kind](node.what, context)
        if(type instanceof Type.Int) {
            return type
        } else {
            return new Type.Float()
        }
    },
    program(node: NodeTypes.Program, context: Context) {
        for(const child of node.children) {
            Handlers[child.kind](child, context)
        }
        return new Type.Void()
    },
    property(node: NodeTypes.Property, context: Context) {
        // node.isFinal
        // node.isStatic
        // node.name
        if(node.value) {
            Handlers[node.value.kind](node.value, context)
        }
        // node.visibility
        return new Type.Void()
    },
    propertylookup(node: NodeTypes.PropertyLookup, context: Context) {
        const what_type = context.noAssign(node.what)
        const offset_type = context.noAssign(node.offset)
        let ctype: Type.Class | Type.ClassInstance
        if(what_type instanceof Type.Class || what_type instanceof Type.ClassInstance) {
            ctype = what_type
        } else if(
            FLUENT_ASSERT_CHAIN &&
            what_type instanceof Type.Optional &&
            (what_type.content instanceof Type.Class || what_type.content instanceof Type.ClassInstance)
        ) {
            ctype = what_type.content
        } else {
            debug(`${what_type}: Not a class?`)
            debug(node.what)
            return new Type.Mixed()
        }
        debug("Object type hit")
        debug(ctype!.shortType, offset_type, node)
        if(offset_type instanceof Type.String) {
            if(ctype instanceof Type.ClassInstance) {
                const class_name = ctype.shortType.replace(/^\\/, "")
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
                    throw new LintError("Internal error: no class " + class_name, node)
                }
            } else {
                throw new LintError("Bad type: " + ctype.constructor.name, node)
            }
        } else {
            debug("Non-string offset")
            return new Type.Mixed() // FIXME
        }
    },
    retif(node: NodeTypes.RetIf, context: Context) {
        const test = Handlers[node.test.kind](node.test, context)
        const true_branch = node.trueExpr ? Handlers[node.trueExpr.kind](node.trueExpr, context) : test
        const false_branch = Handlers[node.falseExpr.kind](node.falseExpr, context)
        if(test.asBoolean === true) {
            return true_branch
        } else if(test.asBoolean === false) {
            return false_branch
        } else {
            return true_branch.combinedWith(false_branch)
        }
    },
    return(node: NodeTypes.Return, context: Context) {
        const type = node.expr ? Handlers[node.expr.kind](node.expr, context) : new Type.Void()
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
    },
    silent(node: NodeTypes.Silent, context: Context) {
        if(node.expr) {
            return Handlers[node.expr.kind](node.expr, context)
        } else {
            return new Type.Void()
        }
    },
    static(node: NodeTypes.Static, context: Context) {
        // TODO add tests relating to staticness
        for(const i of node.items) {
            Handlers[i.kind](i, context)
        }
        return new Type.Void()
    },
    staticlookup(node: NodeTypes.StaticLookup, context: Context) {
        const t = Handlers[node.what.kind](node.what, context)
        const o = Handlers[node.offset.kind](node.offset, context)
        if(t instanceof Type.Class && o instanceof Type.String && o.value) {
            const l = t.classMethods.get(o.value)
            if(l) {
                return l
            } else {
                debug(`SL search failure on ${t} (${o.value})`)
            }
        } else {
            debug(node)
        }
        return new Type.Mixed()
    },
    string(node: NodeTypes.String) {
        // node.raw
        // node.value
        return new Type.String(node.value)
    },
    switch(node: NodeTypes.Switch, context: Context) {
        const check_value = Handlers[node.test.kind](node.test, context)
        Handlers[node.body.kind](node.body, context)
        // node.shortForm
        return new Type.Void()
    },
    throw(node: NodeTypes.Throw, context: Context) {
        Handlers[node.what.kind](node.what, context)
        return new Type.Void()
    },
    trait(node: NodeTypes.Trait, context: Context) {
        const qname = context.qualifyName(node.name, "qn")
        const trait_structure = new Type.Trait(qname)
        for(const b of node.body) {
            if(b.kind == "method") {
                const t = Handlers[b.kind](b, context)
                if(t instanceof Type.Function) {
                    debug(`Attaching function ${b.name} to ${qname}`)
                    if(b.isStatic) {
                        trait_structure.classMethods.set(b.name, t)
                    } else {
                        trait_structure.methods.set(b.name, t)
                    }
                } else {
                    debug("Method type miss")
                    debug(t)
                }
            } else {
                Handlers[b.kind](b, context)
            }
        }
        // node.extends
        // node.implements
        context.assert(
            node,
            node.name.length > 1,
            "Single-character trait names are too likely to conflict"
        )
        context.assert(
            node,
            !!node.name.match(/^([A-Z0-9][a-z0-9]*)+$/),
            "PSR1 3: trait names must be in camel case"
        )
        context.setConstant(qname.replace(/^\\/, ""), trait_structure)
        debug(`Setting ${qname} as a trait`)
        return trait_structure
    },
    traituse(node: NodeTypes.TraitUse, context: Context) {
        if(node.adaptations) {
            for(const a of node.adaptations) {
                Handlers[a.kind](a, context)
            }
        }
        for(const t of node.traits) {
            Handlers[t.kind](t, context)
        }
        return new Type.Void()
    },
    try(node: NodeTypes.Try, context: Context) {
        Handlers[node.body.kind](node.body, context)
        for(const c of node.catches) {
            Handlers[c.kind](c, context)
        }
        if(node.always) {
            Handlers[node.always.kind](node.always, context)
        }
        return new Type.Void()
    },
    unary(node: NodeTypes.Unary, context: Context) {
        // node.type
        Handlers[node.what.kind](node.what, context)
        return new Type.Mixed() // FIXME
    },
    unset(node: NodeTypes.Unset, context: Context) {
        for(const a of node.arguments) {
            if(a.kind == "variable") {
                if(typeof a.name == "string") {
                    context.unset(a.name)
                }
            }
        }
        return new Type.Void()
    },
    usegroup(node: NodeTypes.UseGroup, context: Context) {
        // type
        if(node.name) {
            for(const u of node.items) {
                context.importName(node.name + u.name, u.alias)
            }
        } else {
            for(const u of node.items) {
                context.importName(u.name, u.alias)
            }
        }
        return new Type.Void()
    },
    useitem(node: NodeTypes.UseItem, context: Context) {
        context.importName(node.name, node.alias)
        return new Type.Void()
    },
    variable(node: NodeTypes.Variable, context: Context) {
        // this.node.curly
        if(typeof node.name == "string") {
            const name = "$" + node.name
            if(context.assigning) {
                if(name == "$this") {
                    throw new LintError(
                        "Internal error: attempt to assign $this",
                        node
                    )
                }
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
            return context.get(name) || new Type.Mixed()
        } else {
            return new Type.Mixed() // FIXME
        }
    },
    while(node: NodeTypes.While, context: Context) {
        const check_value = Handlers[node.test.kind](node.test, context)
        const body_namespace_override: Map<string, Type.Base> = new Map()
        if(node.test.kind == "variable" && typeof node.test.name == "string") {
            const v = context.get("$" + node.test.name)
            if(v instanceof Type.Optional) {
                body_namespace_override.set("$" + node.test.name, v.content)
            }
        } else if(node.test.kind == "unary" && node.test.what.kind == "variable" && typeof node.test.what.name == "string") {
            const v = context.get("$" + node.test.what.name)
            if(v instanceof Type.Optional) {
                body_namespace_override.set("$" + node.test.what.name, v.falseValue)
            }
        }
        let inner_context: Context
        if(body_namespace_override.size) {
            inner_context = new Context(context)
            for(const [name, v] of body_namespace_override.entries()) {
                inner_context.set(name, v)
            }
        } else {
            inner_context = context
        }
        if(check_value.asBoolean === false) {
            debug("Skipping impossible while body")
        } else {
            Handlers[node.body.kind](node.body, inner_context)
        }
        // node.shortForm
        return new Type.Void()
    },
    yield(node: NodeTypes.Yield, context: Context) {
        if(node.key) {
            Handlers[node.key.kind](node.key, context)
        }
        if(node.value) {
            Handlers[node.value.kind](node.value, context)
        }
        return new Type.Void()
    }
}