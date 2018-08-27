import { Base } from "./base";
import { NodeTypes } from "../ast";
export declare class Class extends Base {
    protected node: NodeTypes.Class;
    constructor(node: NodeTypes.Class);
    check(): boolean;
}
