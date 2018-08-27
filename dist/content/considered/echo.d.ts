import { Base } from "./base";
import { NodeTypes } from "../ast";
export declare class Echo extends Base {
    protected node: NodeTypes.Echo;
    constructor(node: NodeTypes.Echo);
    check(): boolean;
}
