import { NodeTypes } from "./ast";
import { Array } from "./considered/array";
import { Assign } from "./considered/assign";
import { Base } from "./considered/base";
import { Block } from "./considered/block";
import { Boolean } from "./considered/boolean";
import { Call } from "./considered/call";
import { Class } from "./considered/class";
import { Closure } from "./considered/closure";
import { ConstRef } from "./considered/constref";
import { Echo } from "./considered/echo";
import { Entry } from "./considered/entry";
import { Function } from "./considered/function";
import { Identifier } from "./considered/identifier";
import { If } from "./considered/if";
import { Include } from "./considered/include";
import { Method } from "./considered/method";
import { Namespace } from "./considered/namespace";
import { New } from "./considered/new";
import { Number } from "./considered/number";
import { Parameter } from "./considered/parameter";
import { Program } from "./considered/program";
import { Property } from "./considered/property";
import { PropertyLookup } from "./considered/propertylookup";
import { Return } from "./considered/return";
import { String } from "./considered/string";
import { Variable } from "./considered/variable";
import { ClassConstant } from "./considered/classconstant";
import { TraitUse } from "./considered/traituse";
import { StaticLookup } from "./considered/staticlookup";
import { Bin } from "./considered/bin";
import { Parenthesis } from "./considered/parenthesis";
import { Isset } from "./considered/isset";
import { Unary } from "./considered/unary";
import { Foreach } from "./considered/foreach";

const byKind: {[kind: string]: typeof Base} = {
    array: Array,
    assign: Assign,
    bin: Bin,
    block: Block,
    boolean: Boolean,
    call: Call,
    class: Class,
    classconstant: ClassConstant,
    closure: Closure,
    constref: ConstRef,
    echo: Echo,
    entry: Entry,
    foreach: Foreach,
    function: Function,
    identifier: Identifier,
    if: If,
    include: Include,
    isset: Isset,
    method: Method,
    namespace: Namespace,
    new: New,
    number: Number,
    parameter: Parameter,
    parenthesis: Parenthesis,
    program: Program,
    property: Property,
    propertylookup: PropertyLookup,
    return: Return,
    staticlookup: StaticLookup,
    string: String,
    traituse: TraitUse,
    unary: Unary,
    variable: Variable,
}
export const Considered = {
    Base: Base,
    Program: Program,
    forNode(node: NodeTypes.Node): Base {
        if(byKind[node.kind]) {
            return new byKind[node.kind](node)
        }
        return new Base(node)
    },
}
