import Context from "../context"
import ContextTypes from "../context-types"
import Node from "./node"
export default class Break extends Node {
    /** @type {?Number} */
    get level() {
        return this.cacheNode("level")
    }
}
