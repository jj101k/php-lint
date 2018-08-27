import * as Known from "../known";
import { NodeTypes } from "../ast";
export declare class Base extends Known.Base {
    protected node: NodeTypes.Node;
    constructor(node: NodeTypes.Node);
    check(): boolean;
}
