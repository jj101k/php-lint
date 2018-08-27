import { Base } from "./base";
import { NodeTypes } from "../ast";
export declare class If extends Base {
    protected node: NodeTypes.If;
    constructor(node: NodeTypes.If);
    check(): boolean;
}
