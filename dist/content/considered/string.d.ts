import { Base } from "./base";
import { NodeTypes } from "../ast";
export declare class String extends Base {
    protected node: NodeTypes.String;
    constructor(node: NodeTypes.String);
    check(): boolean;
}
