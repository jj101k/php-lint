import { NodeTypes } from "../ast";
import { Array } from "./array";
import { Assign } from "./assign";
import { Bin } from "./bin";
import { Block } from "./block";
import { Boolean } from "./boolean";
import { Call } from "./call";
import { Class } from "./class";
import { ClassConstant } from "./classconstant";
import { Closure } from "./closure";
import { ConstRef } from "./constref";
import { Echo } from "./echo";
import { Entry } from "./entry";
import { Foreach } from "./foreach";
import { Function } from "./function";
import { Identifier } from "./identifier";
import { If } from "./if";
import { Include } from "./include";
import { Isset } from "./isset";
import { Method } from "./method";
import { Namespace } from "./namespace";
import { New } from "./new";
import { Number } from "./number";
import { Parameter } from "./parameter";
import { Parenthesis } from "./parenthesis";
import { Program } from "./program";
import { Property } from "./property";
import { PropertyLookup } from "./propertylookup";
import { Return } from "./return";
import { StaticLookup } from "./staticlookup";
import { String } from "./string";
import { TraitUse } from "./traituse";
import { Unary } from "./unary";
import { Variable } from "./variable";

import {Base} from "./base"
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
export function forNode(node: NodeTypes.Node): Base {
    if(byKind[node.kind]) {
        return new byKind[node.kind](node)
    }
    return new Base(node)
}