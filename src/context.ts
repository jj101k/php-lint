import { Known } from "./type/known";

export class Context {
    private globalNamespace: Map<string, Known>
    constructor(from_context?: Context) {
        if(from_context) {
            this.globalNamespace = from_context.globalNamespace
        } else {
            this.globalNamespace = new Map()
        }
    }
}