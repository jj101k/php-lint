import { NodeTypes } from "./ast";
import { Base } from "./considered/base";
import { Echo } from "./considered/echo";
import { Function } from "./considered/function";
import { Include } from "./considered/include";
import { Program } from "./considered/program";
export { Base, Program, Echo, Function, Include };
export declare function forNode(node: NodeTypes.Node): Base;
