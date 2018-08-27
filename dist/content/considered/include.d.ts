import { Base } from "./base";
import { NodeTypes } from "../ast";
export declare class Include extends Base {
    protected node: NodeTypes.Include;
    constructor(node: NodeTypes.Include);
    check(): boolean;
}
