import { Base } from "./base";
import { NodeTypes } from "../ast";
export declare class Number extends Base {
    protected node: NodeTypes.Number;
    constructor(node: NodeTypes.Number);
    check(): boolean;
}
