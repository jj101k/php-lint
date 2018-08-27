import { Base } from "./base";
import { NodeTypes } from "../ast";
export declare class Program extends Base {
    protected node: NodeTypes.Program;
    constructor(node: NodeTypes.Program);
    check(): boolean;
}
