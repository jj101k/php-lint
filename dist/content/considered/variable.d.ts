import { Base } from "./base";
import { NodeTypes } from "../ast";
export declare class Variable extends Base {
    protected node: NodeTypes.Variable;
    constructor(node: NodeTypes.Variable);
    check(): boolean;
}
