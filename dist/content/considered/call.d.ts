import { Base } from "./base";
import { NodeTypes } from "../ast";
export declare class Call extends Base {
    protected node: NodeTypes.Call;
    constructor(node: NodeTypes.Call);
    check(): boolean;
}
