import { Base } from "./base";
import { NodeTypes } from "../ast";
export declare class Array extends Base {
    protected node: NodeTypes.Array;
    constructor(node: NodeTypes.Array);
    check(): boolean;
}
