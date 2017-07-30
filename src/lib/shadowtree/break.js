import Context from "../context"
import ContextTypes from "../context-types"
import _Node from "./node"
export default class Break extends _Node {
    /** @type {?Number} */
    get level() {
        return this.cacheNode("level")
    }
}
