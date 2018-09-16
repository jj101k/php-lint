import "./considered/array";
import "./considered/assign";
import "./considered/bin";
import "./considered/block";
import "./considered/boolean";
import "./considered/call";
import "./considered/class";
import "./considered/classconstant";
import "./considered/closure";
import "./considered/constref";
import "./considered/echo";
import "./considered/entry";
import "./considered/foreach";
import "./considered/function";
import "./considered/identifier";
import "./considered/if";
import "./considered/include";
import "./considered/isset";
import "./considered/method";
import "./considered/namespace";
import "./considered/new";
import "./considered/number";
import "./considered/parameter";
import "./considered/parenthesis";
import "./considered/program";
import "./considered/property";
import "./considered/propertylookup";
import "./considered/return";
import "./considered/staticlookup";
import "./considered/string";
import "./considered/traituse";
import "./considered/unary";
import "./considered/variable";

import { Base } from "./considered/base";
import { byKind, forNode } from "./considered/for-node";

export const Considered = {
    forNode: forNode,
    Base: Base,
    Program: byKind.program,
}
