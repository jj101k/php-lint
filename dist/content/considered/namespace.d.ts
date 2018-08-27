import { Base } from "./base";
import { NodeTypes } from "../ast";
export declare class Namespace extends Base {
    protected node: NodeTypes.Namespace;
    constructor(node: NodeTypes.Namespace);
    check(): boolean;
}
