import { NodeTypes } from "./ast";
import { Assign } from "./considered/assign";
import { Base } from "./considered/base";
import { Class } from "./considered/class";
import { Echo } from "./considered/echo";
import { Function } from "./considered/function";
import { Include } from "./considered/include";
import { Program } from "./considered/program";
import { If } from "./considered/if";
import { Call } from "./considered/call";
import { Namespace } from "./considered/namespace";
import { Variable } from "./considered/variable";
import { String } from "./considered/string";
import { Number } from "./considered/number";
import { Closure } from "./considered/closure";
import { New } from "./considered/new";
import { Array } from "./considered/array";
export { Base, Program, Echo, Function, Include };
export function forNode(node: NodeTypes.Node): Base {
    switch(node.kind) {
        case "array":
            return new Array(node)
        case "assign":
            return new Assign(node)
        case "call":
            return new Call(node)
        case "class":
            return new Class(node)
        case "closure":
            return new Closure(node)
        case "echo":
            return new Echo(node)
        case "function":
            return new Function(node)
        case "include":
            return new Include(node)
        case "if":
            return new If(node)
        case "namespace":
            return new Namespace(node)
        case "new":
            return new New(node)
        case "number":
            return new Number(node)
        case "program":
            return new Program(node)
        case "string":
            return new String(node)
        case "variable":
            return new Variable(node)
        default:
            return new Base(node)
    }
}