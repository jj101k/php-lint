import { Base } from "./base";
import { NodeTypes } from "../ast";
export declare class Assign extends Base {
    protected node: NodeTypes.Assign;
    constructor(node: NodeTypes.Assign);
    check(): boolean;
}
