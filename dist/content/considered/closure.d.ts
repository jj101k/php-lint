import { Base } from "./base";
import { NodeTypes } from "../ast";
export declare class Closure extends Base {
    protected node: NodeTypes.Closure;
    constructor(node: NodeTypes.Closure);
    check(): boolean;
}
