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
const byKind: {[kind: string]: typeof Base} = {
    array: Array,
    assign: Assign,
    call: Call,
    class: Class,
    closure: Closure,
    echo: Echo,
    function: Function,
    if: If,
    include: Include,
    namespace: Namespace,
    new: New,
    number: Number,
    program: Program,
    string: String,
    variable: Variable,
}
export function forNode(node: NodeTypes.Node): Base {
    if(byKind[node.kind]) {
        return new byKind[node.kind](node)
    }
    return new Base(node)
}
