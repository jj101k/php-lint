import { Base } from "./base";
import { NodeTypes } from "../ast";
export declare class New extends Base {
    protected node: NodeTypes.New;
    constructor(node: NodeTypes.New);
    check(): boolean;
}
