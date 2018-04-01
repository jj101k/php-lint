import _Node from "./node"
import {Context, ContextTypes} from "./node"
export default class Break extends _Node {
    /** @type {?Number} */
    get level() {
        return this.cacheNode("level")
    }
}
