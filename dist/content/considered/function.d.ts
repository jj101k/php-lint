import { Base } from "./base";
import { NodeTypes } from "../ast";
export declare class Function extends Base {
    protected node: NodeTypes.Function;
    constructor(node: NodeTypes.Function);
    check(): boolean;
}
